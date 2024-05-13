let currentWalletId;
let currentWalletName;


document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    console.log('App is loading...');
    // clearLocalStorage();
    setupEventListeners();
    listWallets();
    fetchCurrentWallet();
}

function clearLocalStorage() {
    localStorage.clear();
}

function setupEventListeners() {
    document.getElementById('createWalletForm').addEventListener('submit', createWallet);
    document.getElementById('topUpForm').addEventListener('submit', topUpAccount);
    document.getElementById('convertForm').addEventListener('submit', convertCurrency);
    document.getElementById('sendForm').addEventListener('submit', sendCurrency);
}

function fetchCurrentWallet() {
    const savedWalletId = localStorage.getItem('currentWalletId');
    const savedWalletName = localStorage.getItem('currentWalletName');

    if (savedWalletId && savedWalletName) {
        currentWalletId = savedWalletId;
        currentWalletName = savedWalletName;
        updateUIWithWalletInfo({
            name: savedWalletName,
            balance_usdt: localStorage.getItem('balance_usdt'),
            balance_btc: localStorage.getItem('balance_btc')
        });
    } else {
        console.log('No wallet selected.');
    }
}

function createWallet(event) {
    event.preventDefault();
    const walletName = document.getElementById('wallet-name').value;
    fetch(`/api/wallets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: walletName })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to create wallet');
        return response.json();
    })
    .then(data => {
        // alert('Wallet created successfully!');
        localStorage.setItem('currentWalletId', data.id);
        localStorage.setItem('currentWalletName', data.name);
        localStorage.setItem('balance_usdt', data.balance_usdt);
        localStorage.setItem('balance_btc', data.balance_btc);

        // Set these to ensure correct updates
        currentWalletId = data.id;
        currentWalletName = data.name;
        updateUIWithWalletInfo(data);
        resetForm('createWalletForm');
        listWallets();  // Refresh the list of wallets to include the new one
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to create wallet: ' + error.message);
    });
}


function updateWalletInfo() {
    if (!currentWalletId) {
        alert("No wallet selected. Please select a wallet first.");
        return;
    }

    fetch(`/api/wallets/${currentWalletId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch wallet data');
        }
        return response.json();
    })
    .then(wallet => {
        updateUIWithWalletInfo(wallet);
    })
    .catch(error => {
        console.error('Error updating wallet info:', error);
        alert('Failed to update wallet information: ' + error.message);
    });
}


function updateUIWithWalletInfo(wallet) {
    console.log('Updating UI with wallet info:', wallet);
    if (!wallet.name) {
        console.error('Wallet name missing from the data:', wallet);
        wallet.name = currentWalletName;  // Use the currentWalletName if name is missing in the response
    }

    if (!wallet.balance_usdt || !wallet.balance_btc) {
        console.error('Essential wallet balance information missing:', wallet);
        wallet.balance_usdt = wallet.balance_usdt || '0'; // Default to '0' if null
        wallet.balance_btc = wallet.balance_btc || '0'; // Default to '0' if null
    }

    document.getElementById('wallet-name-display').textContent = wallet.name;
    document.getElementById('balance-usdt').textContent = wallet.balance_usdt;
    document.getElementById('balance-btc').textContent = wallet.balance_btc;

    localStorage.setItem('balance_usdt', wallet.balance_usdt);
    localStorage.setItem('balance_btc', wallet.balance_btc);
}



window.onload = () => {
    console.log('Window loading...');
    const savedWalletId = localStorage.getItem('currentWalletId');
    const savedWalletName = localStorage.getItem('currentWalletName');
    console.log(`Retrieved from localStorage - ID: ${savedWalletId}, Name: ${savedWalletName}`);

    listWallets();  // Fetch and list all wallets

    if (savedWalletId && savedWalletId !== 'undefined' && savedWalletName) {
        selectWallet(savedWalletId, savedWalletName);
        document.getElementById('wallet-name-display').textContent = savedWalletName;
    } else {
        console.log('No valid wallet ID found in localStorage.');
    }
};


function showCreateWalletForm() {
    let formHtml = `
        <h2>Create New Wallet</h2>
        <form id="createWalletForm">
            <input type="text" id="wallet-name" placeholder="Enter wallet name" required />
            <button type="submit">Create Wallet</button>
        </form>
    `;
    document.getElementById('forms').innerHTML = formHtml;
    document.getElementById('createWalletForm').addEventListener('submit', createWallet);
}

function showTopUpForm() {
    let formHtml = `
        <h2>Top Up Account</h2>
        <form id="topUpForm">
            <input type="text" id="topup-amount" placeholder="Enter amount in USDT" required />
            <button type="submit">Top Up</button>
        </form>
    `;
    document.getElementById('forms').innerHTML = formHtml;
    document.getElementById('topUpForm').addEventListener('submit', topUpAccount);
}

function showConvertForm() {
    let formHtml = `
        <h2>Convert Currency</h2>
        <form id="convertForm">
            <input type="text" id="convert-amount" placeholder="Enter amount in USDT" required />
            <button type="submit">Convert</button>
        </form>
    `;
    document.getElementById('forms').innerHTML = formHtml;
    document.getElementById('convertForm').addEventListener('submit', convertCurrency);
}

function showSendForm() {
    let formHtml = `
        <h2>Send Currency</h2>
        <form id="sendForm">
            <input type="text" id="recipient-name" placeholder="Recipient Wallet Name" required />
            <input type="text" id="send-amount" placeholder="Enter Bitcoin amount" required />
            <button type="submit">Send</button>
        </form>
    `;
    document.getElementById('forms').innerHTML = formHtml;
    document.getElementById('sendForm').addEventListener('submit', sendCurrency);
}


function topUpAccount(event) {
    event.preventDefault();
    if (!currentWalletId) {
        alert("Please select a wallet first!");
        return;
    }
    let amount = document.getElementById('topup-amount').value;
    fetch(`/api/wallets/${currentWalletId}/topup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
    }).then(handleResponse)
      .then(data => {
        //   alert('Account topped up successfully!');
          console.log(data);
          document.getElementById('balance-usdt').textContent = data.balance_usdt;
          resetForm('topUpForm');  // Reset the top-up form
      })
      .catch(handleError);
}


function handleResponse(response) {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Something went wrong on the server');
    }
}

function handleError(error) {
    console.error('Error:', error);
    alert('Operation failed: ' + error.message);
}


function convertCurrency(event) {
    event.preventDefault();
    let form = document.getElementById('convertCurrencyForm'); // Ensure your form has an ID

    let amount = document.getElementById('convert-amount').value;

    fetch(`/api/wallets/${currentWalletId}/convert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount_usdt: parseFloat(amount) })
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 400) {
            response.json().then(data => {
                alert('Failed to convert: ' + data.detail);
            });
            return Promise.reject('Insufficient funds');
        } else {
            throw new Error('Something went wrong on the server');
        }
    }).then(data => {
        // alert('Currency converted successfully!');
        console.log(data);
        updateUIWithWalletInfo(data);
        resetForm('convertForm');  // Reset the form
    }).catch(error => {
        console.error('Error:', error);
    });
}


function sendCurrency(event) {
    event.preventDefault();
    const amountElement = document.getElementById('send-amount');
    const recipientNameElement = document.getElementById('recipient-name');

    const amount = parseFloat(amountElement.value);
    if (isNaN(amount)) {
        alert('Please enter a valid number for the amount.');
        amountElement.focus();
        return;
    }

    const recipientName = recipientNameElement.value.trim();
    if (!recipientName) {
        alert('Please enter a recipient name.');
        recipientNameElement.focus();
        return;
    }

    const payload = {
        sender_name: currentWalletName,
        recipient_name: recipientName,
        amount_btc: amount
    };

    console.log('Sending payload:', payload);

    fetch('/api/wallets/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            // alert('Currency sent successfully!');
            console.log(data);
            updateUIWithWalletInfo(data);
            resetForm('sendForm');
            fetchAndUpdateWalletInfo(currentWalletId); // Re-fetch wallet data to ensure UI is updated
        } else {
            throw new Error(data.detail || "An unknown error occurred");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to send currency: ' + (error.message || "An error occurred"));
    });
}


function fetchAndUpdateWalletInfo(walletId) {
    if (!walletId || walletId === 'undefined') {
        console.error("fetchAndUpdateWalletInfo called with invalid wallet ID:", walletId);
        return;
    }
    fetch(`/api/wallets/${walletId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch wallet data');
            }
            return response.json();
        })
        .then(wallet => {
            updateUIWithWalletInfo(wallet);
        })
        .catch(error => {
            console.error('Failed to fetch wallet info:', error);
        });
}


function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();  // This resets all form elements to their default values
    }
}


function listWallets() {
    fetch(`/api/wallets/`)
        .then(response => response.json())
        .then(wallets => {
            const walletsList = document.getElementById('wallets-list');
            walletsList.innerHTML = '';  // Clear existing wallets
            wallets.forEach(wallet => {
                const walletElement = document.createElement('button');
                walletElement.textContent = wallet.name;
                walletElement.classList.add('wallet-button');
                walletElement.onclick = () => selectWallet(wallet.id, wallet.name);
                walletsList.appendChild(walletElement);
            });
        })
        .catch(error => console.error('Failed to fetch wallets:', error));
}

function selectWallet(walletId, walletName) {
    console.log(`Selecting wallet with ID: ${walletId} and Name: ${walletName}`);
    if (!walletId || walletId === 'undefined' || !walletName) {
        console.error("Invalid wallet ID or name:", walletId, walletName);
        alert("Failed to select wallet. Please try again.");
        return;
    }
    currentWalletId = walletId;
    currentWalletName = walletName;
    localStorage.setItem('currentWalletId', walletId);
    localStorage.setItem('currentWalletName', walletName);

    updateWalletInfo();  // Immediately fetch and update the wallet info from the API
}

// function showSelectedWallet(walletName) {
//     const selectedWallet = document.getElementById('selected-wallet');
//     if(selectedWallet) {
//         selectedWallet.textContent = `Selected Wallet: ${walletName}`;
//     } else {
//         console.error('selected-wallet element not found');
//     }
// }

function filterWallets() {
    const searchQuery = document.getElementById('wallet-search').value.toLowerCase();
    const wallets = document.querySelectorAll('#wallets-list button');
    wallets.forEach(wallet => {
        const matchesSearch = wallet.textContent.toLowerCase().includes(searchQuery);
        wallet.style.display = matchesSearch ? 'block' : 'none';
    });
    // Ensure wallet list is visible during search
    document.getElementById('wallets-list').style.display = 'flex';
}

function showTransactionHistory() {
    fetch(`/api/transactions/${currentWalletId}`)
        .then(response => response.json())
        .then(transactions => {
            if (transactions && transactions.length > 0) {
                let historyHtml = '<h2>Transaction History</h2><table><tr><th>Type</th><th>Amount BTC</th><th>Date</th></tr>';
                transactions.forEach(tx => {
                    historyHtml += `<tr><td>${tx.type}</td><td>${tx.amount} BTC</td><td>${tx.date}</td></tr>`;
                });
                historyHtml += '</table>';
                document.getElementById('forms').innerHTML = historyHtml;
            } else {
                document.getElementById('forms').innerHTML = "<p>No transactions found.</p>";
            }
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
            alert('Failed to load transactions: ' + error.message);
        });
}


function redirectToTransactionHistory() {
    if (currentWalletId) {
        window.location.href = `/transaction-history/?walletId=${currentWalletId}`;
    } else {
        alert("Please select a wallet first!");
    }
}
