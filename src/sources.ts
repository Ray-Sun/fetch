import { Source } from "./shared/source";

export const OZBARGAIN:string = "OZBARGAIN";

export const SOURCES:{ [key:string]:Source} = {
    [OZBARGAIN]:{
        "name":"OzBargain",
        "url":"https://www.ozbargain.com.au/deals/feed",
        "expiredDays":3
    }
}

export const SALEFINDERRETAILERS:string[] = [
    "Woolworths",
    "Coles",
    "Big-W",
    "Kmart",
    "Myer",
    "Priceline"
]