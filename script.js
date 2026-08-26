// Bread Dough Calculator - JavaScript Implementation

document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    calculateBtn.addEventListener('click', calculateRecipe);
    
    // Initialize with some sample values for testing
    document.getElementById('flour-weight').value = '1000';
    document.getElementById('hydration').value = '65';
    document.getElementById('salt').value = '2';
    document.getElementById('yeast-percent').value = '2';
});

function calculateRecipe() {
    // Get input values
    const flourWeight = parseFloat(document.getElementById('flour-weight').value) || 0;
    const hydration = parseFloat(document.getElementById('hydration').value) || 0;
    const saltPercent = parseFloat(document.getElementById('salt').value) || 0;
    const eggs = parseFloat(document.getElementById('eggs').value) || 0;
    const milk = parseFloat(document.getElementById('milk').value) || 0;
    const butter = parseFloat(document.getElementById('butter').value) || 0;
    const cream = parseFloat(document.getElementById('cream').value) || 0;
    const oil = parseFloat(document.getElementById('oil').value) || 0;
    const yeastType = document.getElementById('yeast-type').value;
    const yeastPercent = parseFloat(document.getElementById('yeast-percent').value) || 0;
    const batchScale = parseFloat(document.getElementById('batch-scale').value) || 1;
    
    // Validate inputs
    if (flourWeight <= 0) {
        showResults('Please enter a valid flour weight');
        return;
    }
    
    // Perform calculations
    const results = calculateDough(flourWeight, hydration, saltPercent, eggs, milk, butter, cream, oil, yeastType, yeastPercent, batchScale);
    
    // Display results
    displayResults(results);
}

function calculateDough(flourWeight, hydration, saltPercent, eggs, milk, butter, cream, oil, yeastType, yeastPercent, batchScale) {
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
        instantYeast: scaledInstantYeast,
        activeDryYeast: scaledActiveDryYeast,
        freshYeast: scaledFreshYeast,
        effectiveHydration: effectiveHydration,
        effectiveFatPercent: effectiveFatPercent
    };
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    
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
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="result-item"><p><strong>Error:</strong> ${message}</p></div>`;
}