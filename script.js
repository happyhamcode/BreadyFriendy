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

// Educational content database
// Educational content database
const educationalContent = {
    basic: {
        title: "Basic White Bread",
        ingredients: [
            {name: "Flour", description: "Provides gluten structure for the bread"},
            {name: "Water", description: "Hydrates flour and activates yeast"},
            {name: "Salt", description: "Enhances flavor and controls fermentation"},
            {name: "Yeast", description: "Makes the dough rise through fermentation"}
        ],
        tips: "Basic white bread benefits from a long, slow first rise for better gluten development. The light texture comes from proper kneading and gentle handling during proofing."
    },
    enriched: {
        title: "Enriched Dough (Brioche)",
        ingredients: [
            {name: "Flour", description: "Provides structure"},
            {name: "Water", description: "Hydrates flour and activates yeast (water from eggs and milk is already accounted for)"},
            {name: "Eggs", description: "Add richness, tenderness, and a golden color"},
            {name: "Milk", description: "Provides moisture and adds flavor"},
            {name: "Butter", description: "Adds richness and creates a tender crumb"},
            {name: "Salt", description: "Enhances the natural sweetness and controls fermentation"},
            {name: "Yeast", description: "Makes the dough rise"}
        ],
        tips: "Brioche requires gentle handling as the high fat content makes it more delicate. A long, cool first rise helps develop flavor while maintaining tenderness."
    },
    sweet: {
        title: "Sweet Dough (Challah)",
        ingredients: [
            {name: "Flour", description: "Provides the structure"},
            {name: "Water", description: "Hydrates flour and activates yeast (water from eggs is already accounted for)"},
            {name: "Eggs", description: "Add richness, tenderness, and a golden color"},
            {name: "Oil", description: "Creates a soft, tender texture"},
            {name: "Salt", description: "Enhances and balances the natural sweetness"},
            {name: "Yeast", description: "Makes the dough rise"}
        ],
        tips: "Challah benefits from a warm, humid proofing environment for best braiding. The oil content gives the bread its characteristic soft texture."
    },
    wholeWheat: {
        title: "Whole Wheat Bread",
        ingredients: [
            {name: "Whole Wheat Flour", description: "Provides nutrients, fiber, and nutty flavor"},
            {name: "Water", description: "Hydrates the flour and activates yeast"},
            {name: "Salt", description: "Enhances flavor and controls fermentation"},
            {name: "Yeast", description: "Makes the dough rise"},
            {name: "Optional enrichments (eggs, milk, butter)", description: "Add tenderness and moisture when included"}
        ],
        tips: "Whole wheat bread benefits from a longer fermentation time to develop flavor. The whole grains absorb more water, so increase hydration as needed."
    },
    rye: {
        title: "Rye Bread",
        ingredients: [
            {name: "Rye Flour", description: "Provides the distinctive tangy flavor and dense texture"},
            {name: "Water", description: "Hydrates the flour and activates yeast"},
            {name: "Salt", description: "Enhances flavor and controls fermentation"},
            {name: "Yeast", description: "Makes the dough rise (rye often requires a longer fermentation)"},
            {name: "Optional enrichments (eggs, milk, butter)", description: "Add richness when included"}
        ],
        tips: "Rye bread benefits from a long fermentation time and often needs more water than wheat bread due to rye's high absorption properties. Consider adding vital wheat gluten for better structure."
    },
    italian: {
        title: "Italian Bread (Ciabatta, Pullman)",
        ingredients: [
            {name: "Flour", description: "Provides the structure"},
            {name: "Water", description: "Hydrates flour and activates yeast"},
            {name: "Salt", description: "Enhances flavor and controls fermentation"},
            {name: "Yeast", description: "Makes the dough rise"},
            {name: "Optional oil", description: "Adds tenderness to the crumb"}
        ],
        tips: "Italian breads benefit from a high hydration recipe and proper fermentation. Techniques like stretch and folds can develop the characteristic airiness. A hot oven with steam creates the signature crispy crust."
    },
    milk: {
        title: "Milk Bread",
        ingredients: [
            {name: "Flour", description: "Provides the structure"},
            {name: "Water", description: "Hydrates flour and activates yeast (water from milk is already accounted for)"},
            {name: "Milk", description: "Adds moisture, sugar, and creates a golden color"},
            {name: "Butter", description: "Adds richness and creates tenderness"},
            {name: "Salt", description: "Enhances flavor"},
            {name: "Yeast", description: "Makes the dough rise"}
        ],
        tips: "Milk bread is best when baked in a preheated oven for a golden, slightly crispy crust. The milk content contributes to both the sweet flavor and tender crumb."
    },
    sourdough: {
        title: "Sourdough Bread",
        ingredients: [
            {name: "Flour", description: "Provides structure"},
            {name: "Water", description: "Hydrates flour and activates fermentation"},
            {name: "Salt", description: "Enhances flavor and controls fermentation"},
            {name: "Sourdough Starter", description: "Natural fermentation agent providing both leavening and complex flavors"}
        ],
        tips: "Sourdough requires maintaining a healthy starter with regular feeding. Proper timing of fermentation is crucial - over-proofing will result in sour flavor, under-proofing will give dense results."
    },
    custom: {
        title: "Custom Recipe",
        ingredients: [
            {name: "Any combination of flour, water, salt, yeast, eggs, milk, butter, cream, oil, and/or sourdough starter", description: "All ingredient combinations are allowed"}
        ],
        tips: "When experimenting, monitor hydration levels closely. Remember that eggs, milk, and butter all contribute water to your dough."
    }
};

// Educational content database
// Educational content database
const educationalContent = {
    basic: {
        title: "Basic White Bread",
        description: "A simple yet perfect recipe using just flour, water, salt, and yeast. Ideal for everyday loaves with a light texture.",
        characteristics: [
            "Simple, straightforward recipe",
            "No enriching ingredients beyond basic components",
            "Ideal for everyday loaves with a light texture",
            "Use all-purpose or bread flour for best results",
            "Typical hydration: 60-65%"
        ],
        ingredientExplanations: {
            flour: "All-purpose or bread flour provides the gluten structure needed for proper bread development.",
            water: "Provides hydration necessary for gluten formation and yeast activity.",
            salt: "Enhances flavor and controls yeast fermentation rate.",
            yeast: "Leavens the dough by producing carbon dioxide gas."
        },
        tips: [
            "Use good quality all-purpose or bread flour",
            "Knead until smooth and elastic for proper gluten development",
            "Allow proper proofing time for best results",
            "Bake at 425°F (220°C) for excellent crust formation"
        ]
    },
    
    enriched: {
        title: "Enriched Dough (Brioche)",
        description: "Rich, tender dough with eggs and butter for exceptional softness and flavor. Perfect for enriched breads.",
        characteristics: [
            "Rich, tender dough with exceptional softness and flavor",
            "Includes eggs and butter for rich texture and flavor",
            "The water content from enriching ingredients is factored into hydration calculations",
            "Use high-quality ingredients for best results",
            "Typical hydration: 55-65%"
        ],
        ingredientExplanations: {
            flour: "High-protein bread flour or all-purpose flour provides structure for the rich dough.",
            water: "Includes water from eggs and butter in the effective hydration calculation.",
            salt: "Enhances flavor while controlling fermentation.",
            yeast: "Leavens the dough with the rich ingredients.",
            eggs: "Contribute moisture, protein, and fat which improve texture and tenderness.",
            milk: "Adds gentle sweetness and moisture with minimal extra water content.",
            butter: "Provides richness and tenderness to the crumb (16% water content)."
        },
        tips: [
            "Use high-quality ingredients for a superior product",
            "Mix eggs and butter into the dough gently to maintain their richness",
            "Brioche benefits from longer fermentation times",
            "Allow adequate proofing time - it's a rich dough that needs time to develop structure"
        ]
    },
    
    sweet: {
        title: "Sweet Dough (Challah)",
        description: "Traditional braided bread using eggs and oil for distinctive flavor and texture. Sweet but not overly so.",
        characteristics: [
            "Traditional braided bread using eggs and oil for distinctive flavor",
            "Sweet but not overly so - the sweetness comes from natural ingredients",
            "Oil can be any cooking oil (vegetable, canola, etc.)",
            "The water content from eggs is factored into hydration calculations",
            "Create a soft, tender crumb that's perfect for braiding"
        ],
        ingredientExplanations: {
            flour: "Bread flour for good gluten structure needed for proper braiding.",
            water: "Includes water from eggs in the effective hydration calculation.",
            salt: "Enhances flavor without overpowering the sweetness.",
            yeast: "Leavens the dough with appropriate timing.",
            eggs: "Provide moisture, protein, and fat for soft texture (75% water content).",
            oil: "Adds richness and tenderness to maintain a soft crumb structure."
        },
        tips: [
            "Keep gluten development moderate to avoid tough braided strands",
            "Proper proofing is essential for good braiding",
            "Oil helps maintain the desired soft, tender texture",
            "Consider using a braid mold for more consistent results"
        ]
    },
    
    'whole-wheat': {
        title: "Whole Wheat Bread",
        description: "Nutritious dough using whole wheat flour with optional enrichments. Higher fiber content and robust flavor.",
        characteristics: [
            "Nutritious dough using whole wheat flour with optional enrichments",
            "Higher hydration due to whole wheat flour's absorption properties",
            "Whole wheat absorbs more water than white flour, so adjust accordingly",
            "Use bread flour or high-protein flour for better structure",
            "Typical hydration: 70-75%"
        ],
        ingredientExplanations: {
            flour: "Whole wheat flour provides nutrients and fiber but absorbs more water.",
            water: "Higher hydration needed due to whole wheat absorption properties.",
            salt: "Enhances flavor of the whole grains.",
            yeast: "Leavens the dough, though whole wheat requires longer development time.",
            eggs: "Optional enrichments that add moisture and fat for better texture.",
            milk: "Adds gentle sweetness and moisture with minimal extra water content.",
            butter: "Provides richness and tends to the crumb (16% water content)."
        },
        tips: [
            "Whole wheat flour requires more hydration than white flour",
            "Consider mixing half whole wheat, half white flour for a good balance",
            "Longer fermentation time helps with better texture development",
            "Add vital wheat gluten if using mostly whole wheat flour for better structure"
        ]
    },
    
    rye: {
        title: "Rye Bread",
        description: "Distinctive tangy flavor using rye flour with possible enrichments. Higher hydration due to rye's absorption properties.",
        characteristics: [
            "Distinctive tangy flavor using rye flour",
            "Higher hydration due to rye's absorption properties",
            "Rye flour is much more absorbent than wheat flour",
            "Often uses a mix of rye and wheat flours",
            "Consider adding vital wheat gluten to improve structure",
            "Typical hydration: 75-80%"
        ],
        ingredientExplanations: {
            flour: "Rye flour, often mixed with wheat flour for better texture.",
            water: "Higher hydration needed due to rye absorption properties.",
            salt: "Enhances the distinctive rye flavor.",
            yeast: "While traditional rye breads use starter, this calculator uses commercial yeast.",
            eggs: "Optional enrichments that add moisture and fat.",
            milk: "Adds gentle sweetness and moisture with minimal extra water content.",
            butter: "Provides richness (16% water content)."
        },
        tips: [
            "Rye flour requires much more hydration than wheat flour",
            "Use a combination of rye and wheat flours for better structure",
            "Consider adding vital wheat gluten for better rise",
            "Be patient with fermentation - rye takes longer to develop full flavor"
        ]
    },
    
    italian: {
        title: "Italian Bread (Ciabatta, Pullman)",
        description: "Light, airy crumb with crispy exterior. Great for sandwiches and traditional Italian breads.",
        characteristics: [
            "Light, airy crumb with crispy exterior",
            "Great for sandwiches and traditional Italian breads",
            "Oil can be included to improve texture",
            "Higher hydration levels give the characteristic airiness",
            "Uses a long, slow fermentation process in most cases",
            "Typical hydration: 60-70%"
        ],
        ingredientExplanations: {
            flour: "High-protein flour for proper structure with high hydration.",
            water: "Higher hydration level gives characteristic airiness to the crumb.",
            salt: "Enhances flavor and controls fermentation rate.",
            yeast: "Leavens the dough.",
            oil: "Improves texture by making a more tender crumb."
        },
        tips: [
            "Higher hydration levels require careful handling during shaping",
            "Use proper fermentation time for proper air pocket development",
            "Preheat oven thoroughly for crispy crust",
            "Consider using a Dutch oven or steam for better crust formation"
        ]
    },
    
    milk: {
        title: "Milk Bread",
        description: "Soft, sweet, tender crumb with golden color from milk. Classic enriched bread.",
        characteristics: [
            "Soft, sweet, tender crumb with golden color from milk",
            "Classic enriched bread that's perfect for snacking",
            "The water content from milk is factored into hydration calculations",
            "Butter adds richness and tenderness to the texture",
            "Ideal for dinner rolls or slicing for sandwiches",
            "Typical hydration: 65-70%"
        ],
        ingredientExplanations: {
            flour: "Bread flour for good structure with enrichment.",
            water: "Includes water from milk in effective hydration calculation.",
            salt: "Enhances sweet flavor balance.",
            yeast: "Leavens the dough appropriately.",
            milk: "Creates sweet, tender crumb, 87% water content.",
            butter: "Adds richness and tenderness (16% water content)."
        },
        tips: [
            "Milk provides both moisture and gentle sweetness",
            "Butter adds necessary richness for tender texture",
            "Keep mixing time moderate to prevent tough gluten development",
            "Ideal temperature for baking is 375°F (190°C) for golden color"
        ]
    },
    
    sourdough: {
        title: "Sourdough Bread",
        description: "Fermented dough using a starter for complex flavor and texture. Develops unique taste over time.",
        characteristics: [
            "Fermented dough using naturally cultivated sourdough starter",
            "Develops complex, tangy flavors over time through fermentation",
            "Requires regular feeding and maintenance of the starter",
            "Fermentation times can vary significantly based on temperature",
            "The hydration level will depend heavily on your starter's activity",
            "Uses only the starter for leavening, no commercial yeast"
        ],
        ingredientExplanations: {
            flour: "Provides gluten structure for traditional sourdough.",
            water: "Used in both starter and dough preparation.",
            salt: "Enhances the complex sourdough flavors.",
            starter: "Natural fermentation source that produces acids and gases.",
            "No commercial yeast": "Sourdough uses only natural fermentation properties."
        },
        tips: [
            "Maintain your starter regularly with feeding",
            "Temperature significantly affects fermentation time",
            "Sourdough usually takes longer than commercial methods to rise",
            "Keep consistent fermentation timing for best flavor development"
        ]
    },
    
    custom: {
        title: "Custom Recipe",
        description: "Full control over all ingredients for unique combinations and experiments.",
        characteristics: [
            "Full control over all ingredients for unique combinations",
            "No restrictions on ingredient amounts or ratios",
            "All ingredient combinations are allowed",
            "All hydration calculations are handled automatically",
            "Ideal for experimentation with new bread types"
        ],
        ingredientExplanations: {
            flour: "Base ingredient for structure.",
            water: "Provides necessary hydration for gluten formation.",
            salt: "Enhances flavor across all bread types.",
            yeast: "Leavens the dough as appropriate for your recipe.",
            eggs: "Contribute moisture, protein, and fat.",
            milk: "Adds gentle sweetness and moisture with low water content (87% water).",
            butter: "Provides richness and tenderness (16% water content).",
            cream: "High fat content contributes significantly to richness (57.5% water).",
            oil: "Contributes texture and flavor.",
            starter: "Natural fermentation source for sourdough breads."
        },
        tips: [
            "Be mindful of ingredient combinations when creating unique recipes",
            "Understand how enriching ingredients affect hydration levels",
            "Remember to adjust fermentation times for rich doughs",
            "Start with small batches when experimenting"
        ]
    }
};

function selectBreadType(type) {
    // Hide the bread type selection and descriptions
    document.getElementById('bread-type-buttons').style.display = 'none';
    document.getElementById('bread-description-section').style.display = 'none';
    
    // Show educational content for this bread type before calculator
    const educationalSection = document.createElement('div');
    educationalSection.id = 'educational-content';
    educationalSection.className = 'educational-section';
    educationalSection.innerHTML = `
        <div class="result-item">
            <h3>About ${educationalContent[type].title}</h3>
            <p>${educationalContent[type].description}</p>
            
            <h4>Characteristics</h4>
            <ul>
                ${educationalContent[type].characteristics.map(char => `<li>${char}</li>`).join('')}
            </ul>
            
            <h4>Fermentation & Baking Tips</h4>
            <ul>
                ${educationalContent[type].tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;
    
    // Insert educational content before the calculator form
    const calculatorForm = document.getElementById('calculator-form');
    calculatorForm.parentNode.insertBefore(educationalSection, calculatorForm);
    
    // Show the calculator form
    calculatorForm.style.display = 'block';
    
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
    const currentType = document.getElementById('current-bread-type').value;
    
    // Get the educational content for this bread type
    const eduContent = educationalContent[currentType];
    
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
        
        <div class="result-item">
            <h3>About Your Recipe</h3>
            <p>This recipe is tailored for ${eduContent.title}. Here's what makes your specific creation special:</p>
            
            <ul>
                <li><strong>Hydration Level:</strong> ${results.effectiveHydration.toFixed(1)}% - This 
                    ${results.effectiveHydration > 70 ? 'high' : results.effectiveHydration < 60 ? 'low' : 'balanced'} 
                    hydration level is appropriate for the ingredients in your dough.</li>
                
                <li><strong>Fat Content:</strong> ${results.effectiveFatPercent.toFixed(1)}% - This 
                    ${results.effectiveFatPercent > 20 ? 'rich' : results.effectiveFatPercent < 10 ? 'light' : 'moderate'} 
                    fat content contributes to the characteristic texture of your bread type.</li>
                
                <li><strong>Yeast Type:</strong> ${results.yeastType === 'instant' ? 'Instant yeast for quick rise' : results.yeastType === 'active-dry' ? 'Active dry yeast for steady fermentation' : 'Fresh yeast for delicate texture'}</li>
            </ul>
            
            <h4>Ingredient Explanations</h4>
            <ul>
                ${Object.entries(eduContent.ingredientExplanations).map(([ingredient, explanation]) => `<li><strong>${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}:</strong> ${explanation}</li>`).join('')}
            </ul>
            
            <h4>Baking & Fermentation Tips for Your Specific Recipe</h4>
            <ul>
                ${eduContent.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function showResults(message) {
    const resultsDiv = document.getElementById('results-content');
    resultsDiv.innerHTML = `<div class="result-item"><p><strong>Error:</strong> ${message}</p></div>`;
}