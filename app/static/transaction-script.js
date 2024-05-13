window.onload = function() {
    const walletId = new URLSearchParams(window.location.search).get('walletId');
    if (!walletId) {
        document.getElementById('transaction-info').innerHTML = '<p>No wallet selected.</p>';
        return;
    }
    fetchTransactions(walletId);
    fetchWalletDetails(walletId); // Fetch wallet details
};

function fetchTransactions(walletId) {
    fetch(`/api/transactions/${walletId}`)
    .then(response => response.json())
    .then(transactions => {
        updateTransactionList(transactions);
    })
    .catch(error => {
        console.error('Failed to fetch transactions:', error);
        document.getElementById('transaction-info').innerHTML = '<p>Error loading transactions.</p>';
    });
}

function updateTransactionList(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    transactions.forEach(tx => {
        const row = transactionsList.insertRow();
        row.insertCell(0).textContent = new Date(tx.created_at).toLocaleDateString(); // Assuming 'created_at' exists
        row.insertCell(1).textContent = tx.type;
        row.insertCell(2).textContent = tx.amount_usdt;
        row.insertCell(3).textContent = tx.amount_btc.toFixed(3); // Formatting to 3 decimal places
    });
}

function fetchWalletDetails(walletId) {
    fetch(`/api/wallets/${walletId}`)
    .then(response => response.json())
    .then(wallet => {
        if (wallet && wallet.name) {
            document.getElementById('wallet-name').textContent = `: ${wallet.name}`;
        }
    })
    .catch(error => {
        console.error('Failed to fetch wallet details:', error);
    });
}