// GuestRoutes — public pages (no auth required)
import { Route } from "react-router-dom";
import Landing  from "../pages/guest/Landing";
import Login    from "../pages/guest/Login";
import Register from "../pages/guest/Register";

export default function GuestRoutes() {
  return (
    <>
      <Route path="/"         element={<Landing />}  />
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Register />} />
    </>
  );
}
