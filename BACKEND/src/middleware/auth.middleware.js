export const protectRoute = (req, res, next) => {
  // If there is no req.auth or no userId on req.auth, the user is not authenticated.
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ message: "Unauthorized - you must be logged in to access this resource." });
  }

  // If the user is authenticated, proceed to the next middleware or route handler.
  next();
};