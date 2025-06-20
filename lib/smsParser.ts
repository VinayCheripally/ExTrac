export function extractDebitAmounts(messages: string[]): { amount: number; originalMessage: string }[] {
  // Updated regex to handle more formats including "Rs.10.00" without space
  const amountRegex = /(?:₹|INR|Rs\.?)\s*[-/]?\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?/gi;

  const debitPhrases = [
    "has been debited", "debited from", "debited with", "debited by",
    "auto-debited", "debited towards", "debited via", "was debited", "debited", "debit",
    "amt debited", "amount debited", "sum debited", "debited amount",
    "was deducted", "has been deducted", "deducted from", "amount deducted",
    "charged to", "has been charged", "you were debited", "you have been debited",
    "transaction debited", "txn debited", "fee debited", "fee deducted",
    "emi debited", "emi deducted", "auto deduction", "auto debit", "auto-payment of",
    "wallet debited", "payment deducted", "payment of", "₹ debited", "₹ deducted", "₹ charged",
    "transferred to", "has been transferred to", "was transferred to", "amount transferred",
    "you transferred", "payment transferred", "funds transferred", "transferred successfully",
    "transfer of", "money transferred", "sent to", "credited to other account from yours",
    // Added new patterns for UPI and bank transfers
    "credited to", "via upi", "upi ref", "a/c", "account"
  ];

  const ignorePhrases = ["reversed", "refunded", "credited back", "refund"];

  function cleanAmountPart(text: string | null): string {
    return (text || '00').replace(/\D/g, '');
  }

  const results: { amount: number; originalMessage: string }[] = [];
  const debitPhrasesLc = debitPhrases.map(phrase => phrase.toLowerCase());

  for (const msg of messages) {
    const msgLc = msg.toLowerCase();

    // Skip future debits
    if (msgLc.includes("will be debited")) {
      continue;
    }

    // Clean message for better matching
    const cleanedMsg = msgLc.replace(/[\-:=>]+/g, ' ');

    let match;
    amountRegex.lastIndex = 0; // Reset regex
    
    while ((match = amountRegex.exec(msg)) !== null) {
      const [fullMatch, intPart, decPart] = match;
      if (!intPart) continue;

      // Get context around the amount (larger window for better detection)
      const contextStart = Math.max(0, match.index - 60);
      const contextEnd = Math.min(msg.length, match.index + match[0].length + 60);
      const contextWindow = msgLc.slice(contextStart, contextEnd);

      // Skip if contains ignore phrases
      if (ignorePhrases.some(phrase => contextWindow.includes(phrase))) {
        continue;
      }

      // Check if contains debit phrases OR if it's a UPI/transfer message with amount at start
      const hasDebitPhrase = debitPhrasesLc.some(phrase => contextWindow.includes(phrase));
      const isUpiTransfer = msgLc.includes("upi") || msgLc.includes("credited to") || msgLc.includes("a/c");
      const amountAtStart = match.index < 20; // Amount appears early in message
      
      if (hasDebitPhrase || (isUpiTransfer && amountAtStart)) {
        const integer = cleanAmountPart(intPart);
        const decimal = cleanAmountPart(decPart);

        try {
          const amount = parseFloat(`${integer}.${decimal}`);
          if (amount >= 1.0) {
            results.push({
              amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
              originalMessage: msg
            });
          }
        } catch (error) {
          console.error('Error parsing amount:', error);
        }
      }
    }
  }

  return results;
}

export function extractMerchantName(message: string): string {
  // Enhanced patterns for merchant extraction including UPI transfers
  const patterns = [
    // UPI transfer patterns
    /credited to\s+([A-Z][A-Za-z\s&.]+?)(?:\s+via|\s+upi|\s+ref|\s+on|\s+\d|\s*$)/i,
    /to\s+([A-Z][A-Za-z\s&.]+?)(?:\s+via|\s+upi|\s+ref|\s+on|\s+\d|\s*$)/i,
    // Traditional merchant patterns
    /at\s+([A-Z][A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
    /from\s+([A-Z][A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
    /via\s+([A-Z][A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Unknown Merchant';
}