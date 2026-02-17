import { crafting } from '../lib/api';
import RecipeListPage from './RecipeListPage';
import { Hammer } from 'lucide-react';

export default function CraftingPage() {
  return (
    <RecipeListPage
      title="Crafting"
      singular="Crafting Recipe"
      description="Crafting recipes and where to make them."
      api={crafting}
      emptyIcon={Hammer}
    />
  );
}
