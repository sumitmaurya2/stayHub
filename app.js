const  express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const wrapAsync = require('./utils/wrapAsync.js');

// Helper to build `listing` object from multipart/form-data fields
const buildListingFromBody = (body) => {
    if (!body) return {};
    if (body.listing && typeof body.listing === 'object') return body.listing;
    const listing = {};
    for (const key of Object.keys(body)) {
        const m = key.match(/^listing\[(.+)\]$/);
        if (m) listing[m[1]] = body[key];
    }
    return listing;
};

main().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));



app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Hello I am root');
});
//Index route to display all listings

app.get('/listings', async (req, res) => {
const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
});

// New route to display form for creating a new listing

app.get('/listings/new', (req, res) => {
    res.render('listings/new.ejs');
});

// Show route to display a specific listing by ID
app.get('/listings/:id', async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render('listings/show.ejs', { listing });
});

//Create route to handle form submission and create a new listing
app.post('/listings', upload.single('image'), wrapAsync( async (req, res) => {
    console.log('POST /listings body:', req.body);
    console.log('POST /listings file present:', !!req.file);
    const data = buildListingFromBody(req.body || {});
    if (data.price) data.price = Number(data.price);
    const newListing = new Listing(data);
    if (req.file) {
        newListing.image = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
        };
    }
    await newListing.save();
    res.redirect(`/listings`);
}));

//Edit route to display form for editing an existing listing
app.get('/listings/:id/edit', async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render('listings/edit.ejs', { listing });
});

//update route to handle form submission and update an existing listing
app.put('/listings/:id', upload.single('image'), async (req, res) => {
    let { id } = req.params;
    console.log('PUT /listings/:id body:', req.body);
    console.log('PUT /listings/:id file present:', !!req.file);
    const update = buildListingFromBody(req.body || {});
    if (update.price) update.price = Number(update.price);
    if (req.file) {
        update.image = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
        };
    }
    await Listing.findByIdAndUpdate(id, update);
    res.redirect(`/listings/${id}`);
});


// Delete route to handle deletion of a listing
app.delete('/listings/:id', async (req, res) => {
    let { id } = req.params;
    let deletedListing =  await Listing.findByIdAndDelete(id);
    res.redirect('/listings');
});

app.use((err, req, res) => {
    res.send('Something went wrong' + err);
});


app.listen(8080, () => {
        console.log('Server is running on port 8080');
});

