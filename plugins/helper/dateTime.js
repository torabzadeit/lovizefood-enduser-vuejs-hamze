/*
* npm i moment moment-timezone
*/


import moment from "moment-jalaali";
import momentZone from 'moment-timezone'
import currency from "./currency";

const models = {
    getDate(input, outFormat = null, inFormat = null) {
        //not empty input
        if (!input) return null;

        //set default out format
        if (!outFormat) outFormat = 'YYYY/MM/DD';

        //set default in format
        if (!inFormat) inFormat = 'YYYY-MM-DDTHH:mm:ssZ';

        //return result

        let date = moment(input);
        //if (date.isValid() && (date.format('YYYY') > 1990))
            return moment(input, inFormat).utc().format(outFormat);
        //else
            //return 'invalid'
    },
    timeStamp(input, outFormat = null) {
        //not empty input
        if (!input) return null;

        //set default out format
        if (!outFormat) outFormat = 'YYYY/MM/DD - HH:mm';

        return  moment.unix(input).format(outFormat);
        //return result

    },
    getNow(format = null) {
        //set default out format
        if (!format) format = 'YYYY-MM-DDTHH:mm:ssZ';
        //return result
        // let date = moment(input);
        return moment(moment().toDate()).format(format);
    },
    isValidDate(val = null) {
        let date = moment(val);
        return !!(date.isValid() && (date.format('YYYY') > 1990));
    },
    getYear(outFormat = null) {
        let format = outFormat;
        if (!outFormat)
            format = 'YYYY-MM-DDTHH:mm:ssZ';
        return {
            start: this.momentSet.startOf('jYear').format(format),
            end: this.momentSet.endOf('jYear').format(format),
        }
    },
    getMonth(outFormat = null) {
        let format = outFormat;
        if (!outFormat)
            format = 'YYYY-MM-DDTHH:mm:ssZ';
        return {
            start: this.momentSet.startOf('jMonth').format(format),
            end: this.momentSet.endOf('jMonth').format(format),
        }
    },
    getWeek(outFormat = null) {
        // let format = outFormat;
        // if (!outFormat)
        //   format = 'YYYY-MM-DDTHH:mm:ssZ';
        // return {
        //   start: this.momentSet.startOf('jMonth').format(format),
        //   end: this.momentSet.endOf('jMonth').format(format),
        // }
    },
    getRegion() {
        return momentZone.tz.guess();
    },
    timeByZone(input, outFormat = null, inFormat = null) {
        //not empty input
        if (!input) return null;

        //set default out format
        if (!outFormat) outFormat = 'HH:mm:ss';

        //set default in format
        if (!inFormat) inFormat = 'HH:mm:ss';

        let localeTimeZone = momentZone.tz.guess();
        return momentZone(input, inFormat).tz(localeTimeZone).format(outFormat)
    },
};

const dateTime = {
    install(Vue) {
        Vue.mixin({
            data: () => ({
                momentSet: null,
            }),
            created: function () {
                moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});
                this.momentSet = moment();
            },
        });

        Vue.prototype.$dateTime = models;

    }
};

export default dateTime;

