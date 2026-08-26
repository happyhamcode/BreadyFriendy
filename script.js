// Bread Dough Calculator - JavaScript Implementation

document.addEventListener('DOMContentLoaded', function() {
    const breadTypeButtons = document.querySelectorAll('.bread-type-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const backToTypesBtn = document.getElementById('back-to-types-btn');
    const backToCalculatorBtn = document.getElementById('back-to-calculator-btn');
    
    // Set up event listeners for bread type selection
    breadTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectBreadType(this.dataset.type);
        });
    });
    
    calculateBtn.addEventListener('click', calculateRecipe);
    backToTypesBtn.addEventListener('click', showBreadTypes);
    backToCalculatorBtn.addEventListener('click', showCalculator);
    
    // Initialize with sample values for testing
    document.getElementById('flour-weight').value = '1000';
    document.getElementById('hydration').value = '65';
    document.getElementById('salt').value = '2';
    document.getElementById('yeast-percent').value = '2';
});

function selectBreadType(type) {
    // Hide the bread type selection and descriptions
    document.getElementById('bread-type-buttons').style.display = 'none';
    document.getElementById('bread-description-section').style.display = 'none';
    
    // Show the calculator form
    document.getElementById('calculator-form').style.display = 'block';
    
    // Show/hide bread-specific input fields based on selection
    const breadSpecificIngredients = document.getElementById('bread-specific-ingredients');
    
    // Hide all sections first
    const specificSections = breadSpecificIngredients.querySelectorAll('.specific-inputs');
    specificSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the appropriate section
    switch(type) {
        case 'basic':
            document.getElementById('basic-bread-section').style.display = 'block';
            break;
            
        case 'enriched':
            document.getElementById('enriched-bread-section').style.display = 'block';
            break;
            
        case 'sweet':
            document.getElementById('sweet-bread-section').style.display = 'block';
            break;
            
        case 'whole-wheat':
            document.getElementById('whole-wheat-section').style.display = 'block';
            break;
            
        case 'rye':
            document.getElementById('rye-section').style.display = 'block';
            break;
            
        case 'italian':
            document.getElementById('italian-section').style.display = 'block';
            break;
            
        case 'milk':
            document.getElementById('milk-section').style.display = 'block';
            break;
            
        case 'sourdough':
            document.getElementById('sourdough-section').style.display = 'block';
            break;
            
        case 'custom':
            document.getElementById('custom-section').style.display = 'block';
            break;
    }
    
    // Update current bread type in the hidden field
    document.getElementById('current-bread-type').value = type;
}

function showBreadTypes() {
    // Show the bread selection and descriptions
    document.getElementById('bread-type-buttons').style.display = 'block';
    document.getElementById('bread-description-section').style.display = 'block';
    
    // Hide calculator form
    document.getElementById('calculator-form').style.display = 'none';
}

function showCalculator() {
    // Show calculator form (when returning from results)
    document.getElementById('calculator-form').style.display = 'block';
}

function calculateRecipe() {
    const flourWeight = parseFloat(document.getElementById('flour-weight').value);
    const hydration = parseFloat(document.getElementById('hydration').value);
    const salt = parseFloat(document.getElementById('salt').value);
    const yeastPercent = parseFloat(document.getElementById('yeast-percent').value);
    const currentBreadType = document.getElementById('current-bread-type').value;
    
    if (isNaN(flourWeight) || isNaN(hydration) || isNaN(salt) || isNaN(yeastPercent)) {
        alert("Please enter valid numbers for all fields");
        return;
    }
    
    // Reset results display
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    let resultsHtml = '<h3>Recipe Results</h3>';
    let totalWater = 0;
    
    if (currentBreadType === 'basic') {
        // Basic recipe calculation
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
            </div>
        `;
    } else if (currentBreadType === 'enriched') {
        // Enriched recipe calculation - account for water in eggs and milk
        const eggAmount = parseFloat(document.getElementById('egg-amount').value) || 0;
        const milkAmount = parseFloat(document.getElementById('milk-amount').value) || 0;
        const butterAmount = parseFloat(document.getElementById('butter-amount').value) || 0;
        
        // Water content in ingredients (approximate)
        const waterFromEggs = eggAmount * 0.75; // ~75% water content
        const waterFromMilk = milkAmount * 0.87; // ~87% water content  
        const waterFromButter = butterAmount * 0.15; // ~15% water content
        
        const totalWaterAdded = waterFromEggs + waterFromMilk + waterFromButter;
        const calculatedHydration = (totalWaterAdded + (flourWeight * (hydration / 100))) / flourWeight * 100;
        
        // Final calculations
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Eggs:</strong> ${eggAmount}g (provides ${waterFromEggs.toFixed(1)}g water)</p>
                <p><strong>Milk:</strong> ${milkAmount}g (provides ${waterFromMilk.toFixed(1)}g water)</p>
                <p><strong>Butter:</strong> ${butterAmount}g (provides ${waterFromButter.toFixed(1)}g water)</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
                <p><strong>Effective Hydration:</strong> ${calculatedHydration.toFixed(1)}%</p>
            </div>
        `;
    } else if (currentBreadType === 'sweet') {
        // Sweet recipe calculation - account for water in eggs and oil
        const eggAmount = parseFloat(document.getElementById('egg-amount').value) || 0;
        const oilAmount = parseFloat(document.getElementById('oil-amount').value) || 0;
        
        // Water content in ingredients (approximate)
        const waterFromEggs = eggAmount * 0.75; // ~75% water content
        
        const totalWaterAdded = waterFromEggs;
        const calculatedHydration = (totalWaterAdded + (flourWeight * (hydration / 100))) / flourWeight * 100;
        
        // Final calculations
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Eggs:</strong> ${eggAmount}g (provides ${waterFromEggs.toFixed(1)}g water)</p>
                <p><strong>Oil:</strong> ${oilAmount}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
                <p><strong>Effective Hydration:</strong> ${calculatedHydration.toFixed(1)}%</p>
            </div>
        `;
    } else if (currentBreadType === 'whole-wheat') {
        // Whole wheat calculation
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Whole Wheat Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
            </div>
        `;
    } else if (currentBreadType === 'rye') {
        // Rye calculation
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Rye Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
            </div>
        `;
    } else if (currentBreadType === 'italian') {
        // Italian calculation
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
            </div>
        `;
    } else if (currentBreadType === 'milk') {
        // Milk bread calculation - account for water in milk and butter
        const milkAmount = parseFloat(document.getElementById('milk-amount').value) || 0;
        const butterAmount = parseFloat(document.getElementById('butter-amount').value) || 0;
        
        // Water content in ingredients (approximate)
        const waterFromMilk = milkAmount * 0.87; // ~87% water content  
        const waterFromButter = butterAmount * 0.15; // ~15% water content
        
        const totalWaterAdded = waterFromMilk + waterFromButter;
        const calculatedHydration = (totalWaterAdded + (flourWeight * (hydration / 100))) / flourWeight * 100;
        
        // Final calculations
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Milk:</strong> ${milkAmount}g (provides ${waterFromMilk.toFixed(1)}g water)</p>
                <p><strong>Butter:</strong> ${butterAmount}g (provides ${waterFromButter.toFixed(1)}g water)</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
                <p><strong>Effective Hydration:</strong> ${calculatedHydration.toFixed(1)}%</p>
            </div>
        `;
    } else if (currentBreadType === 'sourdough') {
        // Sourdough calculation
        const starterAmount = parseFloat(document.getElementById('starter-amount').value) || 0;
        
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Sourdough Starter:</strong> ${starterAmount}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
            </div>
        `;
    } else if (currentBreadType === 'custom') {
        // Custom recipe for full control
        const water = flourWeight * (hydration / 100);
        totalWater += water;
        const saltAmount = flourWeight * (salt / 100);
        const yeast = flourWeight * (yeastPercent / 100);
        
        resultsHtml += `
            <div class="result-item">
                <p><strong>Flour:</strong> ${flourWeight}g</p>
                <p><strong>Water:</strong> ${water.toFixed(1)}g</p>
                <p><strong>Salt:</strong> ${saltAmount.toFixed(1)}g</p>
                <p><strong>Yeast:</strong> ${yeast.toFixed(1)}g</p>
            </div>
        `;
    }
    
    resultsHtml += '<p style="margin-top: 20px;"><strong>Total Water Used:</strong> ' + totalWater.toFixed(1) + 'g</p>';
    resultsContainer.innerHTML = resultsHtml;
    
    // Show the results
    document.getElementById('results-section').style.display = 'block';
}

function resetCalculator() {
    // Reset all form inputs to default values
    document.getElementById('flour-weight').value = '1000';
    document.getElementById('hydration').value = '65';
    document.getElementById('salt').value = '2';
    document.getElementById('yeast-percent').value = '2';
    
    // Reset additional inputs based on type
    const breadType = document.getElementById('current-bread-type').value;
    if (breadType === 'enriched') {
        document.getElementById('egg-amount').value = '0';
        document.getElementById('milk-amount').value = '0';
        document.getElementById('butter-amount').value = '0';
    } else if (breadType === 'sweet') {
        document.getElementById('egg-amount').value = '0';
        document.getElementById('oil-amount').value = '0';
    } else if (breadType === 'milk') {
        document.getElementById('milk-amount').value = '0';
        document.getElementById('butter-amount').value = '0';
    } else if (breadType === 'sourdough') {
        document.getElementById('starter-amount').value = '0';
    }
    
    // Hide results
    document.getElementById('results-section').style.display = 'none';
}