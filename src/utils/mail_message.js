class MailMessage {
    constructor() {
        this.to = '';
        this.from = '';
        this.subject = '';
        this.body = '';
    }

    setTo(to) {
        this.to = to;
    }

    setFrom(from) {
        this.from = from;
    }

    setSubject(subject) {
        this.subject = subject;
    }

    setBody(body) {
        this.body = body;
    }

    getTo() {
        return this.to;
    }

    getFrom() {
        return this.from;
    }

    getSubject() {
        return this.subject;
    }

    getBody() {
        return this.body;
    }
}

class WalletTopupInvoiceMessage extends MailMessage {
    constructor() {
        super();
        this.setFrom(' ');
        this.setSubject('Invoice for Wallet Topup');
    }

    setBody(invoice) {
        this.body = `
            <h1>Invoice for Wallet Topup</h1>
            <p>Amount: ${invoice.amount}</p>
            <p>Date: ${invoice.date}</p>
            <p>Transaction reference: ${invoice.transaction.reference}</p>
        `;
    }

    getBody() {
        return this.body;
    }
}

class WalletTopupReceiptMessage extends MailMessage {
    constructor() {
        super();
        this.setFrom(' ');
        this.setSubject('Receipt for Wallet Topup');
    }

    setBody(receipt) {
        this.body = `
            <h1>Receipt for Wallet Topup</h1>
            <p>Amount: ${receipt.amount}</p>
            <p>Date: ${receipt.date}</p>
            <p>Transaction reference: ${receipt.reference}</p>
            `;
    }

    getBody() {
        return this.body;
    }
}

class WalletWithdrawalReceiptMessage extends MailMessage {
    constructor() {
        super();
        this.setFrom(' ');
        this.setSubject('Receipt for Wallet Withdrawal');
    }

    setBody(receipt) {
        this.body = `
            <h1>Receipt for Wallet Withdrawal</h1>
            <p>Amount: ${receipt.amount}</p>
            <p>Date: ${receipt.date}</p>
            <p>Transaction reference: ${receipt.reference}</p>
            `;
    }

    getBody() {
        return this.body;
    }
}

module.exports = {
    MailMessage,
    WalletTopupInvoiceMessage,
    WalletTopupReceiptMessage,
    WalletWithdrawalReceiptMessage,
};
