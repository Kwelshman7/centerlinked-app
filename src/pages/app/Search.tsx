import { Card } from "@/components/ui/card";
import { SearchForm } from "@/components/app/search/SearchForm";

export default function Search() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Find in-network facilities</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Search verified treatment contracts by insurance, location, and level of care.
        </p>
      </div>
      <Card className="p-5 sm:p-6">
        <SearchForm />
      </Card>
    </div>
  );
}
