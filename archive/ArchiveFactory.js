require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import Details from './Details'
import Home from './Home'
import Collection from './Collection'
import Texts from './Texts'
import Image from './Image'
import AV from './AV'
import DetailsError from './DetailsError'

export default class ArchiveFactory {
    static async factory(itemid, res, htm) {
        if (!itemid) {
            (await new Home(itemid, undefined).fetch()).render(res, htm);
        } else {
            let obj = await new Details(itemid).fetch();
            item = obj.item;
            if (!item.metadata) {
                new DetailsError(itemid, item, `item ${itemid} cannot be found or does not have metadata`).render(res, htm); //TODO-DETAILS test
            } else {
                if (verbose) console.log("Found mediatype", item.metadata.mediatype);
                switch (item.metadata.mediatype) {
                    case "collection": //TODO-DETAILS-REFACTOR
                        return (await new Collection(itemid, item).fetch()).render(res, htm);
                        break;
                    case "texts":
                        new Texts(itemid, item).render(res, htm);
                        break;
                    case "image":
                        new Image(itemid, item).render(res, htm);
                        break;
                    case "audio": // Intentionally drop thru to movies
                    case "movies":
                        new AV(itemid, item).render(res, htm);
                        break;
                    default:
                        new DetailsError(itemid, item, `Unsupported mediatype: ${item.metadata.mediatype}`).render(res, htm); //TODO-DETAILS test
                    //    return new Nav(")
                }
            }
        }
    }

}
