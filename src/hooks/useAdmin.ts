import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("role", "admin");

      if (!roles?.length) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { isAdmin, loading };
}
