import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mt-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">That page doesn’t exist on this farm.</p>
      <Button asChild size="lg" className="mt-5"><Link to="/">Back to dashboard</Link></Button>
    </div>
  );
}
