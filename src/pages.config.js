import Diagnostics from './pages/Diagnostics';
import History from './pages/History';
import NewQuery from './pages/NewQuery';
import Results from './pages/Results';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Diagnostics": Diagnostics,
    "History": History,
    "NewQuery": NewQuery,
    "Results": Results,
}

export const pagesConfig = {
    mainPage: "NewQuery",
    Pages: PAGES,
    Layout: __Layout,
};