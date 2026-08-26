# PROJECT STRUCTURE

## BreadyFriendy - Bread Dough Calculator

This document outlines the project structure of the BreadyFriendy bread dough calculator application.

### Core Files

1. **index.html** - Main HTML structure with:
   - Bread type selection buttons at top of page
   - Detailed bread descriptions for each type
   - Calculator form with appropriate inputs per bread type
   - Results display section

2. **script.js** - JavaScript calculations and interface logic:
   - Handles bread type selection and navigation
   - Calculates precise ingredient amounts for each bread type
   - Manages hydration calculations including water from enriching ingredients
   - Validates input values for realistic ingredient quantities
   - Handles yeast conversions across different yeast types
   - Implements batch scaling functionality

3. **style.css** - Comprehensive CSS styling:
   - Modern, responsive design
   - Clear visual hierarchy
   - Consistent color scheme
   - Mobile-responsive layout
   - Proper spacing and typography

4. **README.md** - Project documentation:
   - Overview of features and usage
   - Technical details of implementation
   - Development instructions

### Documentation Files

1. **INGREDIENT_GUIDANCE.md** - Detailed guidance on ingredient usage for each bread type:
   - Specific ingredients required for each bread type
   - Best practices and tips for each dough type
   - Water content from enriching ingredients

2. **DOUGH_TYPE_RESEARCH.md** - Research-based information about various bread types:
   - Characteristics and uses of different bread doughs
   - Hydration calculations methodology
   - Ingredient properties and conversions

### File Organization

The project uses a clean, flat structure:
```
breadyfrendy/
├── index.html          # Main application interface
├── script.js           # Core application logic
├── style.css           # Visual styling
├── README.md           # Project documentation
├── INGREDIENT_GUIDANCE.md  # Ingredient usage guidance
└── DOUGH_TYPE_RESEARCH.md  # Bread type research information
```

### Implementation Approach

The calculator follows these key principles:
- Bread types are selected at the top of the page with descriptions below
- Inputs are dynamically shown/hidden based on bread type selection
- Hydration calculations include water content from eggs, milk, butter, and cream
- Validation prevents unrealistic ingredient quantities
- Responsive design works on all device sizes
- Clean, intuitive user interface with clear navigation