// Import our custom CSS
import '../css/main.css'

// Import all of Bootstrap's JS
import 'bootstrap'

// Import Bootstrap's CSS
import 'bootstrap/dist/css/bootstrap.min.css'

import { IncludeParser } from './parser.js';
import { SPAFrame } from './spa-frame.js';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await IncludeParser.run();
    SPAFrame.start();
});
