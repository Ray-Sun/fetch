import { Pool } from "./pool";
import { barginInfo2Feed } from "./shared/dataProcessing";
let pool = new Pool();



export const fetch = ()=>{
    pool.getCatalogueData().then(barginInfo2Feed);
} 

