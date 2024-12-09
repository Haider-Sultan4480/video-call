import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();
const server = createServer(app);
const io = new Server(server);
const allusers= {};

// Resolve __dirname in ES Modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve index.html on GET request
app.get("/", (req, res) => {
    console.log("GET Request /");
    res.sendFile(join(__dirname, "app", "index.html"));
});

// Expose the public directory
app.use(express.static(join(__dirname, "public")));

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log(`Client connected with Socket ID: ${socket.id}`);

    // Handle "join-user" event
    socket.on("join-user", (username) => {
        console.log(`${username} joined the socket connection`);

        allusers[username] = { username, id: socket.id };
        // inform everyone that someone joined
        io.emit("joined", allusers);
    });
    
   

        
    socket.on("offer", ({from, to, offer}) => {
            console.log({from , to, offer });
            io.to(allusers[to].id).emit("offer", {from, to, offer});
        });  
        
        
    socket.on("answer", ({from, to, answer}) => {
            io.to(allusers[from].id).emit("answer", {from, to, answer});
         });    
    socket.on("icecandidate", candidate => {
            console.log({ candidate });
            //broadcast to other peers
            socket.broadcast.emit("icecandidate", candidate);
        });   

        socket.on("end-call", ({from, to}) => {
            io.to(allusers[to].id).emit("end-call", {from, to});
        });

        socket.on("call-ended", caller => {
            const [from, to] = caller;
            io.to(allusers[from].id).emit("call-ended", caller);
            io.to(allusers[to].id).emit("call-ended", caller);
        })

        
     
    });

    


// Start the server
server.listen(9000, () => {
    console.log("Server is listening on port 9000");
});
