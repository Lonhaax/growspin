const data = {
  "success": true,
  "invoice": {
    "id": 44,
    "userId": 1,
    "paymentId": "d70b261d1eb19b210650f814b16be86b",
    "address": "bc1qsqgqpkgvxl3l8qkryntvxaawy3p4dtzn2katht",
    "status": "waiting",
    "payAmount": 0.14810427,
    "payCurrency": "LTC",
    "dlsCredited": 38461,
    "createdAt": "2026-09-30T12:07:47.123Z"
  },
  "internalInvoiceId": 44,
  "address": "bc1qsqgqpkgvxl3l8qkryntvxaawy3p4dtzn2katht",
  "payAmount": 0.14810427
};

if (data.success && data.address) {
  const newInvoice = {
    internalInvoiceId: data.internalInvoiceId,
    payment_id: data.invoice.paymentId,
    pay_address: data.address,
    pay_amount: data.payAmount,
    pay_currency: data.invoice.payCurrency,
    status: 'waiting'
  };
  console.log("Would setInvoice to:", newInvoice);
}
