import { recipes } from '../lib/api';
import RecipeListPage from './RecipeListPage';
import { BookOpen } from 'lucide-react';

export default function RecipesPage() {
  return (
    <RecipeListPage
      title="Recipes"
      description="Item recipes and their required ingredients."
      api={recipes}
      emptyIcon={BookOpen}
    />
  );
}
