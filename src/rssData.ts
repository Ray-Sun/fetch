import { Pool } from "./pool";
import { OZBARGAIN, SOURCES } from "./sources";
import { barginInfo2Feed } from "./shared/dataProcessing";

let pool = new Pool();

export const fetch = () => {
    // task 1 : get ozbargain data
    pool.getRSSData(SOURCES[OZBARGAIN]).then(barginInfo2Feed)
}

