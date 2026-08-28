// Bread Dough Calculator - Scientific Approach

document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    
    // Set up event listeners
    calculateBtn.addEventListener('click', calculateRecipe);
    resetBtn.addEventListener('click', resetCalculator);
    recalculateBtn.addEventListener('click', showCalculator);
    
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
    
    // Calculate base water amount
    let totalWater = flourWeight * (targetHydration / 100);
    
    // Track enrichers
    const enricherWeights = {};
    
    // Check each enricher
    if (document.getElementById('use-eggs').checked) {
        enricherWeights.eggs = parseFloat(document.getElementById('eggs-amount-input').value) || 0;
        totalWater += enricherWeights.eggs * 0.7; // Eggs are ~70% water
    }
    
    if (document.getElementById('use-milk').checked) {
        enricherWeights.milk = parseFloat(document.getElementById('milk-amount-input').value) || 0;
        totalWater += enricherWeights.milk * 0.87; // Milk is ~87% water
    }
    
    if (document.getElementById('use-butter').checked) {
        enricherWeights.butter = parseFloat(document.getElementById('butter-amount-input').value) || 0;
        totalWater += enricherWeights.butter * 0.15; // Butter is ~15% water
    }
    
    if (document.getElementById('use-oil').checked) {
        enricherWeights.oil = parseFloat(document.getElementById('oil-amount-input').value) || 0;
        // Oil is 0% water, but we track it for nutritional info
    }
    
    if (document.getElementById('use-cream').checked) {
        enricherWeights.cream = parseFloat(document.getElementById('cream-amount-input').value) || 0;
        totalWater += enricherWeights.cream * 0.82; // Cream is ~82% water
    }
    
    const saltAmount = flourWeight * (saltPercent / 100);
    const yeastAmount = flourWeight * (yeastPercent / 100);
    
    // Calculate final water needed to reach target hydration
    const effectiveWater = totalWater;
    const additionalWaterNeeded = (flourWeight * (targetHydration / 100)) - (effectiveWater - 
        ((enricherWeights.eggs || 0) * 0.7) - 
        ((enricherWeights.milk || 0) * 0.87) - 
        ((enricherWeights.butter || 0) * 0.15) - 
        ((enricherWeights.cream || 0) * 0.82));
    
    // Build and display results
    const resultsContainer = document.getElementById('results-container');
    let output = `
        <div class="results-content">
            <h3>Recipe Summary</h3>
            <p><strong>Total Flour:</strong> ${flourWeight}g</p>
            <p><strong>Target Hydration:</strong> ${targetHydration}%</p>
            <p><strong>Effective Water Content:</strong> ${effectiveWater.toFixed(1)}g</p>
            
            <h4>Ingredients Breakdown</h4>
            <ul>
                <li>Flour: ${flourWeight}g (100%)</li>
                <li>Water: ${(additionalWaterNeeded + effectiveWater - 
                    ((enricherWeights.eggs || 0) * 0.7) - 
                    ((enricherWeights.milk || 0) * 0.87) - 
                    ((enricherWeights.butter || 0) * 0.15) - 
                    ((enricherWeights.cream || 0) * 0.82)).toFixed(1)}g</li>
                <li>Salt: ${saltAmount.toFixed(1)}g (${saltPercent}% of flour)</li>
                <li>Yeast: ${yeastAmount.toFixed(1)}g (${yeastPercent}% of flour)</li>
    `;
    
    // Add enrichers to output
    if (enricherWeights.eggs > 0) {
        output += `<li>Eggs: ${enricherWeights.eggs}g (~${(enricherWeights.eggs * 0.7).toFixed(1)}g water)</li>`;
    }
    if (enricherWeights.milk > 0) {
        output += `<li>Milk: ${enricherWeights.milk}g (~${(enricherWeights.milk * 0.87).toFixed(1)}g water)</li>`;
    }
    if (enricherWeights.butter > 0) {
        output += `<li>Butter: ${enricherWeights.butter}g (~${(enricherWeights.butter * 0.15).toFixed(1)}g water)</li>`;
    }
    if (enricherWeights.oil > 0) {
        output += `<li>Oil: ${enricherWeights.oil}g</li>`;
    }
    if (enricherWeights.cream > 0) {
        output += `<li>Cream: ${enricherWeights.cream}g (~${(enricherWeights.cream * 0.82).toFixed(1)}g water)</li>`;
    }
    
    output += `
            </ul>
            
            <h4>Key Information</h4>
            <p>This recipe will provide approximately ${targetHydration}% hydration when all enrichers are properly accounted for.</p>
        </div>
    `;
    
    resultsContainer.innerHTML = output;
    
    // Show results
    document.getElementById('calculator-form').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
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
}

function showCalculator() {
    document.getElementById('calculator-form').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
}