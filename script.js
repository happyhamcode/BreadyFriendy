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
    // Hide the calculator form and results
    document.getElementById('calculator-form').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    
    // Show the bread type selection and descriptions
    document.getElementById('bread-type-buttons').style.display = 'block';
    document.getElementById('bread-description-section').style.display = 'block';
}

function showCalculator() {
    // Hide results section
    document.getElementById('results-section').style.display = 'none';
    
    // Show calculator form again
    document.getElementById('calculator-form').style.display = 'block';
}

// Validation functions to check for excessive ingredients
function validateIngredientInputs() {
    const flourWeight = parseFloat(document.getElementById('flour-weight').value) || 0;
    const eggs = parseFloat(document.getElementById('eggs').value) || 0;
    const milk = parseFloat(document.getElementById('milk').value) || 0;
    const butter = parseFloat(document.getElementById('butter').value) || 0;
    const cream = parseFloat(document.getElementById('cream').value) || 0;
    const oil = parseFloat(document.getElementById('oil').value) || 0;
    const starter = parseFloat(document.getElementById('starter').value) || 0;
    
    // Check if any ingredient significantly exceeds flour weight (shouldn't be more than 3x flour weight)
    if (eggs > flourWeight * 3) {
        return {valid: false, message: "Eggs amount seems excessive. Please adjust."};
    }
    if (milk > flourWeight * 3) {
        return {valid: false, message: "Milk amount seems excessive. Please adjust."};
    }
    if (butter > flourWeight * 3) {
        return {valid: false, message: "Butter amount seems excessive. Please adjust."};
    }
    if (cream > flourWeight * 3) {
        return {valid: false, message: "Cream amount seems excessive. Please adjust."};
    }
    if (oil > flourWeight * 3) {
        return {valid: false, message: "Oil amount seems excessive. Please adjust."};
    }
    if (starter > flourWeight * 3) {
        return {valid: false, message: "Sourdough starter amount seems excessive. Please adjust."};
    }
    
    // Check for negative values
    if (eggs < 0 || milk < 0 || butter < 0 || cream < 0 || oil < 0 || starter < 0) {
        return {valid: false, message: "Ingredient amounts cannot be negative."};
    }
    
    return {valid: true, message: "Valid inputs"};
}

function calculateRecipe() {
    // Validate inputs
    const validation = validateIngredientInputs();
    if (!validation.valid) {
        showResults(validation.message);
        return;
    }

    // Get input values
    const flourWeight = parseFloat(document.getElementById('flour-weight').value) || 0;
    const hydration = parseFloat(document.getElementById('hydration').value) || 0;
    const saltPercent = parseFloat(document.getElementById('salt').value) || 0;
    const eggs = parseFloat(document.getElementById('eggs').value) || 0;
    const milk = parseFloat(document.getElementById('milk').value) || 0;
    const butter = parseFloat(document.getElementById('butter').value) || 0;
    const cream = parseFloat(document.getElementById('cream').value) || 0;
    const oil = parseFloat(document.getElementById('oil').value) || 0;
    const starter = parseFloat(document.getElementById('starter').value) || 0;
    const yeastType = document.getElementById('yeast-type').value;
    const yeastPercent = parseFloat(document.getElementById('yeast-percent').value) || 0;
    const batchScale = parseFloat(document.getElementById('batch-scale').value) || 1;
    
    // Validate basic parameters
    if (flourWeight <= 0) {
        showResults('Please enter a valid flour weight');
        return;
    }
    
    if (hydration < 0) {
        showResults('Hydration level cannot be negative');
        return;
    }
    
    // Perform calculations
    const results = calculateDough(flourWeight, hydration, saltPercent, eggs, milk, butter, cream, oil, starter, yeastType, yeastPercent, batchScale);
    
    // Display results
    displayResults(results);
}

function calculateDough(flourWeight, hydration, saltPercent, eggs, milk, butter, cream, oil, starter, yeastType, yeastPercent, batchScale) {
    // Calculate effective water from enriching ingredients
    const eggWater = eggs * 0.75;  // 75% water content in whole eggs
    const milkWater = milk * 0.87;  // 87% water content in whole milk
    const butterWater = butter * 0.16;  // 16% water content in butter
    const creamWater = cream * 0.575;  // Average water content in cream
    
    const effectiveWater = eggWater + milkWater + butterWater + creamWater;
    
    // Calculate total water needed for target hydration
    const waterNeeded = (hydration / 100) * flourWeight;
    
    // Calculate actual water amount including enriching ingredients
    const actualWater = waterNeeded - effectiveWater;
    
    // Calculate yeast amounts based on type
    let instantYeast, activeDryYeast, freshYeast;
    instantYeast = (yeastPercent / 100) * flourWeight;
    activeDryYeast = instantYeast * 1.25;
    freshYeast = instantYeast * 3.0;
    
    // Calculate effective fat percentage
    const butterFat = butter * 0.81;  // 81% fat in butter
    const eggFat = eggs * 0.10;  // 10% fat in whole eggs (approx)
    const creamFat = cream * 0.375;  // 37.5% fat in cream
    
    const effectiveFat = butterFat + eggFat + creamFat + oil;
    const effectiveFatPercent = (effectiveFat / flourWeight) * 100;
    
    // Calculate salt amount
    const saltAmount = (saltPercent / 100) * flourWeight;
    
    // Scale everything to batch size
    const scaledWater = actualWater * batchScale;
    const scaledSalt = saltAmount * batchScale;
    const scaledEggs = eggs * batchScale;
    const scaledMilk = milk * batchScale;
    const scaledButter = butter * batchScale;
    const scaledCream = cream * batchScale;
    const scaledOil = oil * batchScale;
    const scaledStarter = starter * batchScale;
    const scaledInstantYeast = instantYeast * batchScale;
    const scaledActiveDryYeast = activeDryYeast * batchScale;
    const scaledFreshYeast = freshYeast * batchScale;
    
    // Effective hydration calculation
    const effectiveHydration = ((actualWater + effectiveWater) / flourWeight) * 100;
    
    return {
        flour: flourWeight * batchScale,
        water: scaledWater,
        salt: scaledSalt,
        eggs: scaledEggs,
        milk: scaledMilk,
        butter: scaledButter,
        cream: scaledCream,
        oil: scaledOil,
        starter: scaledStarter,
        instantYeast: scaledInstantYeast,
        activeDryYeast: scaledActiveDryYeast,
        freshYeast: scaledFreshYeast,
        effectiveHydration: effectiveHydration,
        effectiveFatPercent: effectiveFatPercent,
        yeastType: yeastType
    };
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results-content');
    
    let html = `
        <div class="result-item">
            <h3>Recipe Summary</h3>
            <p><strong>Total Flour:</strong> ${results.flour.toFixed(0)}g</p>
            <p><strong>Effective Hydration:</strong> ${results.effectiveHydration.toFixed(1)}%</p>
            <p><strong>Effective Fat:</strong> ${results.effectiveFatPercent.toFixed(1)}%</p>
        </div>
        
        <div class="result-item">
            <h3>Ingredients</h3>
            <p>Water: ${results.water.toFixed(0)}g</p>
            <p>Salt: ${results.salt.toFixed(0)}g</p>
            <p>Eggs: ${results.eggs.toFixed(0)}g</p>
            <p>Milk: ${results.milk.toFixed(0)}g</p>
            <p>Butter: ${results.butter.toFixed(0)}g</p>
            <p>Cream: ${results.cream.toFixed(0)}g</p>
            <p>Oil: ${results.oil.toFixed(0)}g</p>
            <p>Sourdough Starter: ${results.starter.toFixed(0)}g</p>
        </div>
        
        <div class="result-item">
            <h3>Yeast Amounts</h3>
            <p>Instant Yeast: ${results.instantYeast.toFixed(2)}g</p>
            <p>Active Dry Yeast: ${results.activeDryYeast.toFixed(2)}g</p>
            <p>Fresh/Cake Yeast: ${results.freshYeast.toFixed(2)}g</p>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function showResults(message) {
    const resultsDiv = document.getElementById('results-content');
    resultsDiv.innerHTML = `<div class="result-item"><p><strong>Error:</strong> ${message}</p></div>`;
}