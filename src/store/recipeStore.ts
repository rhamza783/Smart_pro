import { create } from 'zustand';
import { Recipe } from '../types';

interface RecipeState {
  recipes: Recipe[];
  getRecipe: (menuItemId: string) => Recipe | null;
  saveRecipe: (recipe: Recipe) => void;
  deleteRecipe: (menuItemId: string) => void;
  hasRecipe: (menuItemId: string) => boolean;
  getRecipeSummary: (menuItemId: string) => string;
}

const STORAGE_KEY = 'inv_recipes';

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),

  getRecipe: (menuItemId) => {
    return get().recipes.find(r => r.menuItemId === menuItemId) || null;
  },

  saveRecipe: (recipe) => {
    set(state => {
      const existingIndex = state.recipes.findIndex(r => r.menuItemId === recipe.menuItemId);
      let newRecipes;
      if (existingIndex >= 0) {
        newRecipes = [...state.recipes];
        newRecipes[existingIndex] = { ...recipe, updatedAt: Date.now() };
      } else {
        newRecipes = [...state.recipes, { ...recipe, updatedAt: Date.now() }];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipes));
      return { recipes: newRecipes };
    });
  },

  deleteRecipe: (menuItemId) => {
    set(state => {
      const newRecipes = state.recipes.filter(r => r.menuItemId !== menuItemId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipes));
      return { recipes: newRecipes };
    });
  },

  hasRecipe: (menuItemId) => {
    return get().recipes.some(r => r.menuItemId === menuItemId);
  },

  getRecipeSummary: (menuItemId) => {
    const recipe = get().getRecipe(menuItemId);
    if (!recipe) return 'No recipe';
    const count = recipe.ingredients.length;
    return `${count} ingredient${count === 1 ? '' : 's'}`;
  },
}));
