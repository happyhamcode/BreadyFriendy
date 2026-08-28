// Bread Dough Calculator - Scientific Approach

document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    
    // Set up event listeners
    calculateBtn.addEventListener('click', calculateRecipe);
    resetBtn.addEventListener('click', resetCalculator);
    recalculateBtn.addEventListener('click', function() {
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('calculator-section').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Back to home button
    backToHomeBtn.addEventListener('click', function() {
        document.getElementById('calculator-section').style.display = 'none';
        document.getElementById('introduction-section').style.display = 'block';
    });
    
    // Open calculator buttons
    document.getElementById('open-calculator-btn').addEventListener('click', function() {
        document.getElementById('introduction-section').style.display = 'none';
        document.getElementById('calculator-section').style.display = 'block';
    });
    
    document.getElementById('open-calculator-btn-bottom').addEventListener('click', function() {
        document.getElementById('introduction-section').style.display = 'none';
        document.getElementById('calculator-section').style.display = 'block';
    });
    
    // Enricher checkbox handling
    document.getElementById('use-eggs').addEventListener('change', function() {
        document.getElementById('eggs-amount').style.display = this.checked ? 'block' : 'none';
        if (this.checked && !document.getElementById('eggs-amount-input').value) {
            document.getElementById('eggs-amount-input').value = '120';
        }
    });
    
    document.getElementById('use-milk').addEventListener('change', function() {
        document.getElementById('milk-amount').style.display = this.checked ? 'block' : 'none';
        if (this.checked && !document.getElementById('milk-amount-input').value) {
            document.getElementById('milk-amount-input').value = '100';
        }
    });
    
    document.getElementById('use-butter').addEventListener('change', function() {
        document.getElementById('butter-amount').style.display = this.checked ? 'block' : 'none';
        if (this.checked && !document.getElementById('butter-amount-input').value) {
            document.getElementById('butter-amount-input').value = '100';
        }
    });
    
    document.getElementById('use-oil').addEventListener('change', function() {
        document.getElementById('oil-amount').style.display = this.checked ? 'block' : 'none';
        if (this.checked && !document.getElementById('oil-amount-input').value) {
            document.getElementById('oil-amount-input').value = '100';
        }
    });
    
    document.getElementById('use-cream').addEventListener('change', function() {
        document.getElementById('cream-amount').style.display = this.checked ? 'block' : 'none';
        if (this.checked && !document.getElementById('cream-amount-input').value) {
            document.getElementById('cream-amount-input').value = '100';
        }
    });
    
    // Initialize with sample values for testing
    document.getElementById('flour-weight').value = '1000';
    document.getElementById('target-hydration').value = '65';
    document.getElementById('salt-percent').value = '2';
    document.getElementById('yeast-percent').value = '0.2';
});

function calculateRecipe() {
    // Get input values
    const flourWeight = parseFloat(document.getElementById('flour-weight').value);
    const targetHydration = parseFloat(document.getElementById('target-hydration').value);
    const saltPercent = parseFloat(document.getElementById('salt-percent').value);
    const yeastPercent = parseFloat(document.getElementById('yeast-percent').value);
    
    if (isNaN(flourWeight) || isNaN(targetHydration) || isNaN(saltPercent) || isNaN(yeastPercent) || 
        flourWeight <= 0 || targetHydration < 0 || saltPercent < 0 || yeastPercent < 0) {
        alert('Please enter valid values for all fields');
        return;
    }
    
    // Calculate water content
    let totalWater = flourWeight * (targetHydration / 100);
    
    // Track enricher contributions to water
    let enricherWater = 0;
    let enricherFat = 0;
    let enricherProtein = 0;
    
    // Process enrichers and calculate their contribution
    if (document.getElementById('use-eggs').checked) {
        const eggsAmount = parseFloat(document.getElementById('eggs-amount-input').value);
        if (!isNaN(eggsAmount)) {
            enricherWater += eggsAmount * 0.75; // Eggs are ~75% water
        }
    }
    
    if (document.getElementById('use-milk').checked) {
        const milkAmount = parseFloat(document.getElementById('milk-amount-input').value);
        if (!isNaN(milkAmount)) {
            enricherWater += milkAmount * 0.87; // Milk is ~87% water
        }
    }
    
    if (document.getElementById('use-butter').checked) {
        const butterAmount = parseFloat(document.getElementById('butter-amount-input').value);
        if (!isNaN(butterAmount)) {
            enricherWater += butterAmount * 0.18; // Butter is ~18% water
            enricherFat += butterAmount * 0.82; // Butter is ~82% fat
        }
    }
    
    if (document.getElementById('use-oil').checked) {
        const oilAmount = parseFloat(document.getElementById('oil-amount-input').value);
        if (!isNaN(oilAmount)) {
            enricherFat += oilAmount; // Oil is 100% fat
        }
    }
    
    if (document.getElementById('use-cream').checked) {
        const creamAmount = parseFloat(document.getElementById('cream-amount-input').value);
        if (!isNaN(creamAmount)) {
            enricherWater += creamAmount * 0.87; // Cream is ~87% water
            enricherFat += creamAmount * 0.13; // Cream is ~13% fat
        }
    }
    
    // Calculate final water content after accounting for enrichers
    const waterContent = totalWater - enricherWater;
    
    // Calculate salt and yeast amounts
    const saltAmount = flourWeight * (saltPercent / 100);
    const yeastAmount = flourWeight * (yeastPercent / 100);
    
    // Prepare results
    let resultsHTML = `<h3>Recipe Results</h3><ul>`;
    resultsHTML += `<li><strong>Flour:</strong> ${flourWeight}g</li>`;
    
    if (waterContent > 0) {
        resultsHTML += `<li><strong>Water:</strong> ${waterContent.toFixed(1)}g</li>`;
    }
    
    if (enricherWater > 0) {
        resultsHTML += `<li><strong>Enricher Water:</strong> ${enricherWater.toFixed(1)}g</li>`;
    }
    
    if (saltAmount > 0) {
        resultsHTML += `<li><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</li>`;
    }
    
    if (yeastAmount > 0) {
        resultsHTML += `<li><strong>Yeast:</strong> ${yeastAmount.toFixed(1)}g</li>`;
    }
    
    // Add enricher details
    if (document.getElementById('use-eggs').checked) {
        const eggsAmount = parseFloat(document.getElementById('eggs-amount-input').value);
        if (!isNaN(eggsAmount)) {
            resultsHTML += `<li><strong>Eggs:</strong> ${eggsAmount}g</li>`;
        }
    }
    
    if (document.getElementById('use-milk').checked) {
        const milkAmount = parseFloat(document.getElementById('milk-amount-input').value);
        if (!isNaN(milkAmount)) {
            resultsHTML += `<li><strong>Milk:</strong> ${milkAmount}g</li>`;
        }
    }
    
    if (document.getElementById('use-butter').checked) {
        const butterAmount = parseFloat(document.getElementById('butter-amount-input').value);
        if (!isNaN(butterAmount)) {
            resultsHTML += `<li><strong>Butter:</strong> ${butterAmount}g</li>`;
        }
    }
    
    if (document.getElementById('use-oil').checked) {
        const oilAmount = parseFloat(document.getElementById('oil-amount-input').value);
        if (!isNaN(oilAmount)) {
            resultsHTML += `<li><strong>Oil:</strong> ${oilAmount}g</li>`;
        }
    }
    
    if (document.getElementById('use-cream').checked) {
        const creamAmount = parseFloat(document.getElementById('cream-amount-input').value);
        if (!isNaN(creamAmount)) {
            resultsHTML += `<li><strong>Cream:</strong> ${creamAmount}g</li>`;
        }
    }
    
    resultsHTML += `</ul>`;
    
    // Display results
    document.getElementById('results-container').innerHTML = resultsHTML;
    document.getElementById('results-section').style.display = 'block';
    
    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function resetCalculator() {
    document.getElementById('flour-weight').value = '1000';
    document.getElementById('target-hydration').value = '65';
    document.getElementById('salt-percent').value = '2';
    document.getElementById('yeast-percent').value = '0.2';
    
    // Reset enricher checkboxes
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    // Hide amount inputs
    document.querySelectorAll('.enricher-amounts .input-group').forEach(el => {
        el.style.display = 'none';
    });
    
    // Hide results section
    document.getElementById('results-section').style.display = 'none';
}