import { startBrowser } from './browser.js'
import scraperController from './pageController.js'

const browserInstance = startBrowser()

scraperController(browserInstance)