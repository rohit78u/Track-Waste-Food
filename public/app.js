// Food Waste Tracker Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize local storage if empty
    if (!localStorage.getItem('wasteEntries')) {
        localStorage.setItem('wasteEntries', JSON.stringify([]));
    }

    // Load existing entries
    loadWasteEntries();

    // Form submission handler
    const wasteForm = document.getElementById('wasteForm');
    if (wasteForm) {
        wasteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const date = document.getElementById('date').value;
            const foodType = document.getElementById('foodType').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const unit = document.getElementById('unit').value;
            const reason = document.getElementById('reason').value || 'Not specified';

            // Validate inputs
            if (!date || isNaN(amount) || amount <= 0) {
                alert('Please fill in all required fields with valid values');
                return;
            }

            // Create new entry
            const newEntry = {
                id: Date.now(),
                date,
                foodType,
                amount,
                unit,
                reason
            };

            // Save to local storage
            saveWasteEntry(newEntry);

            // Reload entries
            loadWasteEntries();

            // Reset form
            wasteForm.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        });
    }

    // Set today's date as default
    if (document.getElementById('date')) {
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }
});

// Save waste entry to local storage
function saveWasteEntry(entry) {
    const entries = JSON.parse(localStorage.getItem('wasteEntries'));
    entries.push(entry);
    localStorage.setItem('wasteEntries', JSON.stringify(entries));
    updateWeeklyProgress();
}

// Load waste entries from local storage
function loadWasteEntries() {
    const entries = JSON.parse(localStorage.getItem('wasteEntries'));
    const tableBody = document.getElementById('wasteTableBody');
    
    if (tableBody) {
        // Clear existing rows
        tableBody.innerHTML = '';

        // Add entries to table (show only last 7)
        const recentEntries = entries.slice(-7).reverse();
        recentEntries.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${capitalizeFirstLetter(entry.foodType)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.amount} ${entry.unit}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${capitalizeFirstLetter(entry.reason)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button class="text-red-500 hover:text-red-700" onclick="deleteEntry(${entry.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateWeeklyProgress();
}

// Delete waste entry
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        let entries = JSON.parse(localStorage.getItem('wasteEntries'));
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('wasteEntries', JSON.stringify(entries));
        loadWasteEntries();
    }
}

// Update weekly progress bar
function updateWeeklyProgress() {
    const entries = JSON.parse(localStorage.getItem('wasteEntries'));
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter entries from last 7 days
    const weeklyEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= oneWeekAgo;
    });

    // Calculate total waste (convert all to kg)
    let totalWaste = 0;
    weeklyEntries.forEach(entry => {
        let amount = entry.amount;
        if (entry.unit === 'g') amount /= 1000;
        if (entry.unit === 'lbs') amount *= 0.453592;
        totalWaste += amount;
    });

    // Update UI
    const weeklyGoal = 2.0; // kg
    const progressPercentage = Math.min(100, (totalWaste / weeklyGoal) * 100);
    
    if (document.getElementById('currentWaste')) {
        document.getElementById('currentWaste').textContent = totalWaste.toFixed(1) + ' kg';
    }
    
    if (document.querySelector('.progress-fill')) {
        document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize unit conversion functions
function convertToKg(amount, unit) {
    switch(unit) {
        case 'g': return amount / 1000;
        case 'lbs': return amount * 0.453592;
        default: return amount;
    }
}

// Export data to CSV
function exportToCSV() {
    const entries = JSON.parse(localStorage.getItem('wasteEntries'));
    let csv = 'Date,Food Type,Amount,Unit,Reason\n';
    
    entries.forEach(entry => {
        csv += `${entry.date},${entry.foodType},${entry.amount},${entry.unit},${entry.reason}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'food_waste_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}