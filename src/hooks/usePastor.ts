import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function usePastor() {
  const [isPastor, setIsPastor] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/pastor/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasPastorOrAdmin = roles?.some(
        (r) => r.role === "pastor" || r.role === "admin"
      );

      if (!hasPastorOrAdmin) {
        await supabase.auth.signOut();
        navigate("/pastor/login");
        return;
      }

      setIsPastor(true);
      setLoading(false);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/pastor/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { isPastor, loading };
}
