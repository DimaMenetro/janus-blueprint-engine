import NewQuery from './pages/NewQuery';
import Results from './pages/Results';
import History from './pages/History';
import Diagnostics from './pages/Diagnostics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NewQuery": NewQuery,
    "Results": Results,
    "History": History,
    "Diagnostics": Diagnostics,
}

export const pagesConfig = {
    mainPage: "NewQuery",
    Pages: PAGES,
    Layout: __Layout,
};