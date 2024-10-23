import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import http from "http";
import { Server as SocketIoServer } from "socket.io";
import axios from "axios";

const app = express();
const server = http.createServer(app);
const OPENROUTE_API_KEY =
  "5b3ce3597851110001cf6248e4f4177ca1ee43ebb00c887c66135b9d";

const io = new SocketIoServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = "your_jwt_secret";
app.use(cors());
app.use(express.json());

let users = [
  {
    id: 1,
    email: "customer@example.com",
    password: bcrypt.hashSync("password", 8),
    role: "customer",
  },
  {
    id: 2,
    email: "admin@example.com",
    password: bcrypt.hashSync("password", 8),
    role: "admin",
  },
  {
    id: 3,
    email: "driver@example.com",
    password: bcrypt.hashSync("password", 8),
    role: "driver",
  },
];

let bookings = [];
let drivers = [
  {
    id: 1,
    name: "John Doe",
    available: true,
    location: { lat: 40.7128, lng: -74.006 },
  },
  {
    id: 2,
    name: "Jane Smith",
    available: true,
    location: { lat: 40.758, lng: -73.9855 },
  },
  {
    id: 3,
    name: "Driver Three",
    available: true,
    location: { lat: 40.73061, lng: -73.935242 },
  },
];
let vehicleTypes = [
  { id: 1, name: "Van", icon: "🚗", basePrice: 10, pricePerKm: 0.5 },
  { id: 2, name: "Tempo", icon: "🚙", basePrice: 15, pricePerKm: 0.7 },
  { id: 3, name: "Truck", icon: "🚐", basePrice: 20, pricePerKm: 0.9 },
];

async function calculateRoute(start, end) {
  try {
    const response = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
        headers: {
          Authorization: OPENROUTE_API_KEY,
        },
      }
    );
    return response.data.features[0];
  } catch (error) {
    console.error("Error calculating route:", error);
    throw error;
  }
}

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token,
  });
});

app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

app.get("/api/drivers", (req, res) => {
  res.json(drivers);
});

app.post("/api/drivers/:id/location", (req, res) => {
  const { id } = req.params;
  const { location } = req.body;
  const driver = drivers.find((d) => d.id === parseInt(id));

  if (driver) {
    driver.location = location;
    io.emit("driver_location_update", { driverId: id, location });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

app.get("/api/vehicle-types", (req, res) => {
  res.json(vehicleTypes);
});

app.post("/api/calculate-route", async (req, res) => {
  try {
    const { pickup, dropoff } = req.body;
    const route = await calculateRoute(pickup, dropoff);
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate route" });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const route = await calculateRoute(req.body.pickup, req.body.dropoff);
    const distance = route.properties.segments[0].distance;
    const vehicleType = vehicleTypes.find((v) => v.id === req.body.vehicleType);

    if (!vehicleType) {
      return res.status(400).json({ error: "Invalid vehicle type" });
    }

    const estimatedPrice =
      vehicleType.basePrice + (distance / 1000) * vehicleType.pricePerKm;

    // If it's just an estimate request, return only the price
    if (req.body.estimateOnly) {
      return res.json({ estimatedPrice: estimatedPrice.toFixed(2) });
    }

    // Find nearby drivers
    const availableDrivers = drivers.filter((d) => d.available);
    if (availableDrivers.length === 0) {
      return res
        .status(400)
        .json({ error: "No drivers available in your area" });
    }

    const newBooking = {
      id: bookings.length + 1,
      ...req.body,
      distance,
      estimatedPrice: estimatedPrice.toFixed(2),
      status: "pending",
      createdAt: new Date().toISOString(),
      route: route.geometry,
    };

    bookings.push(newBooking);
    io.emit("new_booking", newBooking);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: "Failed to create booking" });
  }
});

app.get("/api/bookings/:id", (req, res) => {
  const booking = bookings.find((b) => b.id === parseInt(req.params.id));
  if (booking) {
    res.json(booking);
  } else {
    res.status(404).json({ error: "Booking not found" });
  }
});

app.post("/api/bookings/:id/accept", (req, res) => {
  const { driverId } = req.body;
  const booking = bookings.find((b) => b.id === parseInt(req.params.id));
  const driver = drivers.find((d) => d.id === parseInt(driverId));

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (!driver) {
    return res.status(404).json({ error: "Driver not found" });
  }

  booking.status = "accepted";
  booking.driverId = driverId;
  driver.available = false;

  io.emit("booking_updated", booking);
  res.json(booking);
});

app.put("/api/bookings/:id/status", (req, res) => {
  const { driverId, status } = req.body;
  const booking = bookings.find((b) => b.id === parseInt(req.params.id));
  const driver = drivers.find((d) => d.id === parseInt(driverId));

  if (!booking || booking.driverId !== driverId) {
    return res.status(404).json({ error: "Booking not found or unauthorized" });
  }

  booking.status = status;

  if (status === "completed") {
    driver.available = true;
  }

  io.emit("booking_updated", booking);
  res.json(booking);
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("track_booking", (bookingId) => {
    const interval = setInterval(() => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking && booking.driverId) {
        const driver = drivers.find((d) => d.id === booking.driverId);
        if (driver) {
          socket.emit("booking_update", {
            bookingId,
            location: driver.location,
            status: booking.status,
          });
        }
      }
    }, 5000);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      clearInterval(interval);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
