import History from './pages/History';
import NewQuery from './pages/NewQuery';
import Results from './pages/Results';
import Diagnostics from './pages/Diagnostics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "History": History,
    "NewQuery": NewQuery,
    "new-query": NewQuery,
    "Results": Results,
    "Diagnostics": Diagnostics,
}

export const pagesConfig = {
    mainPage: "new-query",
    Pages: PAGES,
    Layout: __Layout,
};