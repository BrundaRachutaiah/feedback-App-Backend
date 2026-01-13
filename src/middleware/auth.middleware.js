const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authMiddleware = (req, res, next) => {
  (async () => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // ✅ matches your DB
      req.user = {
        id: data.user.id,   // UUID
        email: data.user.email,
      };

      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      res.status(401).json({ message: "Unauthorized" });
    }
  })();
};

module.exports = authMiddleware;