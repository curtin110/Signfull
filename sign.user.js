// ==UserScript==
// @name            [curtin110 ]
// @version         0.1.6
// @description     集合各种平台签到
// @author          .Seven
// @crontab         * 1-21 once * *
// @grant           GM_xmlhttpRequest
// @grant           GM_notification
// @grant           GM_log
// @grant           GM_getValue
// @exportCookie    domain=.juejin.cn
// @exportValue     掘金.aid,掘金.uuid,掘金.msToken
// @connect         bbs.binmt.cc
// @connect         www.iculture.cc
// @connect         www.ruike1.com
// @connect         api.live.bilibili.com
// @connect         bbs.kanxue.com
// @connect         bbs.125.la
// @connect         bbs.266.la
// @connect         bbs.tampermonkey.net.cn
// @connect         www.52pojie.cn
// @connect         api.juejin.cn
// @license         GPL
// @cloudCat
// @background
// ==/UserScript==

/* ==UserConfig==
掘金:
    aid:
        title: aid
        description: 请在签到页面上使用开发者工具抓取aid,可以搜索check_in_rules请求查看
    uuid:
        title: uuid
        description: 请在签到页面上使用开发者工具抓取aid,可以搜索check_in_rules请求查看
    msToken:
        title: msToken
        description: 请在签到页面上使用开发者工具抓取msToken,可以搜索check_in_rules请求查看
==/UserConfig== */

function Sign_template() {
    var homeUrl = '',
        signUrl = '',
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = ''

    msg = `${title}🟢重复签到`
    msg = `${title}🟢签到成功`
    msg = `${title}💢未知错误，请查看日志响应信息`

    obj.url = homeUrl
    response(obj, title).then(xhr => {
        // xhr 的一些处理

        GM_notification(msg)
        GM_log(msg, labels)
    })
}

var template_Objs = {
    url: 0,
    data: 0,
    method: 0,
    headers: 0,
    responseType: 0,
};

var request = (paramsObj = {}) => new Promise((resolve, reject) => {
    for (const key in paramsObj) if (!paramsObj[key]) delete paramsObj[key]  // 剔除空值
    var defaultObj = {
        method: 'get',
        onload: response => resolve(response),   // 请求成功完成时触发
        onerror: () => reject('网络错误')         // 请求错误时触发
    }
    Object.assign(defaultObj, paramsObj)          // 合并
    GM_xmlhttpRequest(defaultObj)
})

var response = (obj, title) => new Promise((resolve, reject) => {
    request(obj)
        .then(xhr => resolve(xhr))
        .catch(() => {
            msg = `${title}❌访问失败，网络错误`
            GM_notification(msg)
            GM_log(msg, 'error')
            reject(msg)
        })
})

var parseDom = (str, contentType) => {
    let mimeType = contentType ? contentType.split(';').shift() : 'text/html';
    switch (mimeType) {
        case 'text/html':
        case 'text/xml':
        case 'application/xml':
        case 'application/xhtml+xml':
        case 'image/svg+xml':
            break;
        default:
            mimeType = 'text/html';
    }
    return new DOMParser().parseFromString(str, mimeType);
}

!function main() {
    Sign_bilibili()     // bilibili
    Sign_kanxue()       // 看雪论坛
    Sign_DSU()          // 精易论坛 | 派生社区 | 油猴中文网
    Sign_52pj()         // 52pj
    Sign_MT()           // MT论坛
    Sign_juejin()       // 掘金论坛：签到、抽取、收集Bug
    // Sign_Pig()          // 猪猪资源网站
    Sign_ruike()        // 瑞客资源网站
}()

function Sign_ruike() {
    var signUrl = 'https://www.ruike1.com/k_misign-sign.html?operation=qiandao&format=global_usernav_extra&formhash=f9093311&inajax=1&ajaxtarget=k_misign_topb',
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = '瑞客论坛'

    obj.url = signUrl
    response(obj, title).then(xhr => {
        if (xhr.response.includes(`alt="今日已签"`)) {
            msg = `${title}🟢签到成功`
            labels = "info"
        } else if (xhr.response.includes("CDATA[今日已签]")) {
            msg = `${title}🟢重复签到`
            labels = "info"
        } else {
            msg = `${title}💢未知错误，请查看日志响应信息`
            GM_log(`${title}💢未知错误 响应信息: ${xhr.response}`, 'warn')
        }

        GM_notification(msg)
        GM_log(msg, labels)
    })
}

function Sign_Pig() {
    var signUrl = 'https://www.iculture.cc/wp-admin/admin-ajax.php',
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = 'FancyPing'

    // msg = `${title}🟢重复签到`
    // msg = `${title}🟢签到成功`
    // msg = `${title}💢未知错误，请查看日志响应信息`

    obj.url = signUrl
    obj.method = "POST"
    obj.responseType = "json"
    obj.data = obj2FormData({ action: "user_checkin" }) // 表单提交数据
    obj.headers = {
        'referrer': "https://www.iculture.cc/user/balance",
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response(obj, title).then(xhr => {
        if (xhr?.status == 200) {
            if (xhr?.response?.errpr) {
                msg = `${title}🟢${xhr?.response?.msg}`  // "msg": "签到成功！ 积分+30 经验值+40",
                labels = "info"
            } else {
                msg = `${title}🟢重复签到`  // { "error": true, "ys": "info", "msg": "今日已签到" }
                labels = "info"
            }

        } else {
            msg = `${title}💢未知错误，请查看日志响应信息`
            GM_log(`${title}💢未知错误 响应信息: ${JSON.stringify(xhr.response)}`, 'warn')
        }

        GM_notification({
            text: msg,
            image: 'https://www.iculture.cc/favicon.ico'
        })
        GM_log(msg, labels)
    })
}

/**
 * 对象转表单提交数据 a=1&b=2
 */
function obj2FormData(obj) {
    var str = ''
    Object.keys(obj).forEach(key => {
        var value = `${key}=${obj[key]}`
        str == '' ?
            str = value :
            str += `&${value}`
    });
    // console.log(str);
    return str
}

function Sign_bilibili() {
    var SignliveUrl = 'https://api.live.bilibili.com/sign/doSign',     // 直播签到
        coinUrl = 'https://api.bilibili.com/x/web-interface/nav/stat', // 头像获取硬币❓
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = '哔哩哔哩'

    // 直播签到
    obj.url = SignliveUrl
    obj.responseType = 'json'
    response(obj, title).then(xhr => {
        switch (xhr.response.code) {
            case 0:
                msg = `${title}🟢签到成功`;
                labels = 'info';
                break;
            case 1011040:
                msg = `${title}🟢直播重复签到`;  // {'code':1011040,'message':'今日已签到过,无法重复签到','ttl':1,'data':null}
                labels = 'info';
                break;
            case -101:
                msg = `${title}签到失败❌账号未登录`;
                break
            case 1011038:  // {"code":1011038,"message":"操作太快","ttl":1,"data":null}
                msg = `${title}签到失败❌操作太快`;
            default:

                msg = `${title}💢未知状态码，请查看日志响应信息`
                GM_log(`${title}💢未知状态码响应信息: ${JSON.stringify(xhr.response)}`, 'warn')
        }

        GM_notification(msg)
        GM_log(msg, labels)
    })
}

function Sign_kanxue() {
    var homeUrl = 'https://bbs.kanxue.com/',
        signUrl = 'https://bbs.kanxue.com/user-signin.htm', // 论坛签到
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = '看雪论坛'

    // 访问主页获取 token
    obj.url = homeUrl
    response(obj).then(xhr => {
        let token = parseDom(xhr.response).querySelector(`meta[name='csrf-token']`).content

        obj.url = signUrl
        obj.method = 'post'
        obj.responseType = 'json'
        obj.data = { csrf_token: token }
        response(obj, title).then(xhr => {
            switch (xhr.response.code) {
                case '0': // {'code': '0','message': 3}
                    msg = `${title}🟢签到成功获取雪币:${xhr.response.message}`
                    labels = 'info';
                    break
                case '-1': // {'code': '-1','message': '您今日已签到成功'}
                    labels = 'info';
                    msg = `${title}🟢重复签到`
                    labels = 'info';
                    break
                default:
                    msg = `${title}💢未知状态码，请查看日志响应信息`
                    GM_log(`${title}💢未知状态码响应信息: ${JSON.stringify(xhr.response)}`, 'warn')
            }

            GM_notification(msg)
            GM_log(msg, labels)
        })
    })

}

function Sign_DSU() {
    Sign('https://bbs.125.la/',
        'https://bbs.125.la/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1',
        '精易论坛')

    // Sign('https://bbs.266.la/plugin.php?id=dsu_paulsign:sign',
    //     'https://bbs.266.la/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1',
    //     '派生社区')

    Sign('https://bbs.tampermonkey.net.cn',
        'https://bbs.tampermonkey.net.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1',
        '油猴中文网')

    function Sign(homeUrl, signUrl, title) {
        var obj = Object.assign({}, template_Objs),
            msg = '',
            labels = 'error'

        obj.url = homeUrl
        response(obj, '${title}').then(xhr => {
            let formhash = parseDom(xhr.response).querySelector(`input[name='formhash']`).value
            var data = {
                formhash: formhash,
                submit: '1',
                targerurl: '',
                todaysay: '',
                qdxq: 'kx', // 表情开心
            }

            obj.url = signUrl
            obj.data = obj2FormData(data)  // 转表单数据
            obj.method = 'post'
            obj.responseType = 'json'
            obj.headers = { 'content-type': 'application/x-www-form-urlencoded' }  // 表单协议头
            response(obj, title).then(xhr => {
                if (title === '油猴中文网') {
                    if (xhr.responseText.includes("您今日已经签到")) {
                        msg = `${title}🟢重复签到`
                        labels = 'info';
                    } else if (xhr.responseText.includes("签到成功")) {
                        const regex = /"c">(.*?)</s
                        regex.exec(xhr.responseText)
                        var tmp = RegExp.$1?.replace(/\s/g, "").replace("恭喜你签到成功!", "")  // 恭喜你签到成功!获得随机奖励油猫币6.
                        tmp = tmp.slice(0, tmp.length - 1)             // 获得随机奖励油猫币6
                        msg = `${title}🟢签到成功(${tmp})`
                        labels = 'info'
                    } else {
                        msg = `${title}💢未知状态码，请查看日志响应信息`
                        GM_log(`${title}💢未知状态码响应信息: ` + xhr.responseText, 'warn')
                    }
                } else {
                    switch (xhr.response?.status) {
                        case 0:
                            msg = `${title}🟢${xhr.response?.msg}`;
                            labels = 'info';
                            break
                        case 1:
                            msg = `${title}🟢签到成功`
                            labels = 'info'
                            break
                        default:
                            msg = `${title}💢未知状态码，请查看日志响应信息`
                            GM_log(`${title}💢未知状态码响应信息: ` + JSON.stringify(xhr.response), 'warn')
                    }
                }

                GM_notification(msg)
                GM_log(msg, labels)
            })
        })
    }
}

function Sign_52pj() {
    var dynamicUrl = 'https://www.52pojie.cn/home.php?mod=task&do=apply&id=2',
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = `52破解`

    obj.url = dynamicUrl
    response(obj, '52破解').then(xhr => {
        const regex = /dynamicurl\|\/(.*?)\|/g
        regex.exec(xhr.responseText)

        obj.url = `https://www.52pojie.cn/${RegExp.$1}?wzwscspd=MC4wLjAuMA==`  // 签到 url
        obj.headers = { referer: 'https://www.52pojie.cn/' }
        response(obj, '52破解').then(xhr => {
            if (xhr.responseText.includes('任务已完成')) {
                msg = `${title}🟢签到成功`
                labels = 'info'
            } else if (xhr.responseText.includes('本期您已申请过此任务')) {
                msg = `${title}🟢重复签到`
                labels = 'info'
            } else {
                msg = `${title}💢未知错误，请查看日志响应信息`
                GM_log(`${title}💢未知状态码响应信息: ` + JSON.stringify(xhr.response), 'warn')
            }

            GM_notification(msg)
            GM_log(msg, labels)
        })
    })
}

function Sign_MT() {
    var homeUrl = 'https://bbs.binmt.cc/',
        obj = Object.assign({}, template_Objs),
        msg = '',
        labels = 'error',
        title = 'MT论坛'

    obj.url = homeUrl
    response(obj, title).then(xhr => {
        let formhash = parseDom(xhr.response).querySelector(`input[name='formhash']`).value
        obj.url = `https://bbs.binmt.cc/k_misign-sign.html?operation=qiandao&format=button&formhash=${formhash}&inajax=1&ajaxtarget=midaben_sign`
        response(obj, title).then(xhr => {
            if (xhr.response.includes("今日已签")) {
                msg = `${title}🟢重复签到`  // <root><![CDATA[今日已签]]></root>
                labels = 'info'
            } else if (xhr.response.includes("签到成功")) {
                /*<? xml version = "1.0" encoding = "utf-8" ?>
                    <root>
                        <![CDATA[    <div class="midaben_con mbm">
                            <a href="k_misign-sign.html" class="midaben_signpanel JD_sign visted" id="JD_sign" target="_blank">
                                <div class="font">
                                    已签到
                                </div>
                                <span class="nums">
                                    连续4天
                                </span>
                                <div class="fblock">
                                    <div class="all">
                                        86人
                                    </div>
                                    <div class="line">
                                        89                </div>
                                </div>
                            </a>
                            <div id="JD_win" class="midaben_win JD_win" style="display:block;">
                                <div class="angleA">
                                </div>
                                <div class="angleB">
                                </div>
                                <div class="title">
                                    <h3>签到成功</h3>
                                    <p class="con">
                                        获得随机奖励 1金币 和 。                                </p>
                                </div>
                                <div class="info">已累计签到 541 天。</div>
                            </div>
                        </div>]]>
                    </root>*/
                const regex = /con">(.*?)</s
                regex.exec(a)
                var tmp = RegExp.$1?.replace(/\s/g, "")  // 获得随机奖励1金币和。
                tmp = tmp.slice(0, tmp.length - 2)             // 获得随机奖励1金币
                msg = `${title}🟢签到成功(${tmp})`
                labels = 'info'
            } else {
                msg = `${title}💢未知错误，请查看日志响应信息`
                GM_log(`${title}💢未知状态码响应信息: ` + JSON.stringify(xhr.response), 'warn')
            }

            GM_notification(msg)
            GM_log(msg, labels)
        })
    })
}

async function Sign_juejin() {
    var aid = GM_getValue('掘金.aid'), uuid = GM_getValue('掘金.uuid'), msToken = GM_getValue('掘金.msToken'),
        homeUrl = `https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed?aid=${aid}&uuid=${uuid}&spider=0`,           // 主页
        signUrl = `https://api.juejin.cn/growth_api/v1/check_in?aid=${aid}&uuid=${uuid}&spider=0&msToken=${msToken}`,                // 签到
        luckyfreeCountUrl = `https://api.juejin.cn/growth_api/v1/lottery_config/get?aid=${aid}&uuid=${uuid}`,                     // 获取抽奖免费次数
        luckyUrl = `https://api.juejin.cn/growth_api/v1/lottery/draw?aid=${aid}&uuid=${uuid}&spider=0&msToken=${msToken}`,  // 抽奖
        bugCompetitionIdUrl = `https://api.juejin.cn/user_api/v1/bugfix/competition?aid=${aid}&uuid=${uuid}&spider=0`,            // 获取当前 bug 信息，主要是获取 competition_id
        bugCountUrl = `https://api.juejin.cn/user_api/v1/bugfix/user?aid=${aid}&uuid=${uuid}&spider=0`,                           // 未消除 bug 数，可修复的 bug
        bugInfoUrl = `https://api.juejin.cn/user_api/v1/bugfix/not_collect?aid=${aid}&uuid=${uuid}&spider=0`,                     // 获取当前可消除的 bug 信息
        bugUrl = `https://api.juejin.cn/user_api/v1/bugfix/collect?aid=${aid}&uuid=${uuid}&spider=0`,                             // 消除 bug 
        obj = Object.assign({}, template_Objs),
        msg = '', title = '稀土掘金', labels = 'error',
        min = 1,  // 最小文章数
        headers = {
            "content-type": "application/json",
            "origin": "https://juejin.cn",
            "referer": "https://juejin.cn"
        }
    
    if (!(aid && uuid && msToken)) {
        msg = `获取值失败: aid:${aid} uuid:${uuid} msToken:${msToken}`
        GM_notification(msg);
        GM_log(msg, labels)
        return
    }

    visitArticle()                         // 文章访问请求，算是防检测机制叭
    sign(signUrl)                              // 每日签到
    lucky(luckyfreeCountUrl, luckyUrl)         // 幸运抽奖，只使用免费抽奖次数(似乎需要绑定手机号才行)
    // bug收集功能似乎没用
    // bugfix(bugCompetitionIdUrl, bugCountUrl, bugInfoUrl, bugUrl)                 // Bug 收集，这里应该还有一个提交 bug 的请求，不过目前无法提交所以暂时搁置了

    async function visitArticle(resp) {
        obj = Object.assign({}, template_Objs)
        obj.headers = headers
        obj.url = homeUrl
        obj.data = `{"id_type":2,"client_type":2608,"sort_type":200,"cursor":"0","limit":20}`
        obj.responseType = 'json'
        obj.method = "POST"
        var resp = await response(obj, title)      // 访问掘金主页，响应的应该是推荐文章列表
        var articleList = resp?.response?.data  // 文章列表
        var max = articleList?.length ?? 1      // 文章最大访问数
        var _articleList = []                   // 待访问文章列表
        var randomArticles = Math.floor(Math.random() * (max - min + 1) + min) // 随机生成访问文章数

        for (var i = 0; i < randomArticles; i++) {
            _articleList.push(articleList[parseInt(Math.random() * articleList.length)])  // 随机取文章放进待访问列表
        }

        // visit
        for (const element of _articleList) {
            var article_id = element.item_info.article_id
            obj.data = 0
            obj.url = 'https://juejin.cn/post/' + article_id

            setTimeout(() => {
                response(obj, title)  // 文章访问
            }, Math.floor(Math.random() * (1000 - 5000 + 1) + 5000))  // 延时访问 1-5s
        }
    }

    function sign(signUrl) {
        obj = Object.assign({}, template_Objs)
        obj.url = signUrl
        obj.data = {}
        obj.headers = headers
        obj.responseType = "json"
        obj.method = "post"
        response(obj, title).then(xhr => {
            switch (xhr.response.err_no) {
                case 0:
                    // {"err_no":0,"err_msg":"success","data":{"incr_point":512,"sum_point":762}}
                    let incr_point = xhr?.response?.data?.incr_point  // 签到获取矿石
                    let sum_point = xhr?.response?.data?.sum_point    // 当前账户矿石
                    msg = `${title}🟢签到成功 | ${sum_point}(+${incr_point})`
                    labels = "info"
                    break
                case 15001:
                    // {err_no: 15001, err_msg: '您今日已完成签到，请勿重复签到', data: null}
                    msg = `${title}🟢重复签到`
                    labels = "info"
                    break
                default:
                    msg = `${title}💢未知状态码，请查看日志响应信息`
                    GM_log(`${title}💢未知状态码响应信息: ` + JSON.stringify(xhr.response), 'warn')
            }

            GM_notification(msg)
            GM_log(msg, labels)
        })

        labels = 'error'
    }

    async function lucky(luckyfreeCountUrl, luckyUrl) {
        obj = Object.assign({}, template_Objs)
        obj.url = luckyfreeCountUrl
        obj.headers = headers
        obj.responseType = "json"
        response(obj, title).then(async xhr => {
            var free_count = xhr?.response?.data?.free_count ?? 0
            if (free_count > 0) {  // 存在免费抽奖次数

                obj.url = luckyUrl
                obj.method = "post"
                obj.data = JSON.stringify({})
                var luckyXHR = await response(obj, title)
                /*    "response": {
                        "err_no": 0,
                        "err_msg": "success",
                        "data": {
                            "id": 19,
                            "lottery_id": "6981716980386496552",
                            "lottery_name": "85矿石",
                            "lottery_type": 1,
                            "lottery_image": "https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/32ed6a7619934144882d841761b63d3c~tplv-k3u1fbpfcp-no-mark:0:0:0:0.image",
                            "lottery_desc": "",
                            "lottery_cost": 0,
                            "lottery_reality": 2,
                            "history_id": "7190702028153159713",
                            "total_lucky_value": 30,
                            "draw_lucky_value": 10
                        }
                    }*/
                console.log(luckyXHR)
                msg = `${title}❤抽奖成功 | 奖品(${luckyXHR?.response?.data?.lottery_name}) 幸运值(${luckyXHR?.response?.data?.total_lucky_value})`
                labels = "info"

            } else {
                msg = `${title}💔无抽免费奖次数`
                labels = "info"
            }

            GM_notification(msg);
            GM_log(msg, labels)
        })

        labels = 'error'
    }

    async function bugfix(bugCompetitionIdUrl, bugCountUrl, bugInfoUrl, bugUrl) {
        // 获取 bug 场信息
        obj = Object.assign({}, template_Objs)
        obj.url = bugCompetitionIdUrl
        obj.data = JSON.stringify({ competition_id: "" })
        obj.headers = headers
        obj.responseType = "json"
        obj.method = "POST"
        var xhr = await response(obj, title)
        var competition_name = xhr?.response?.data?.competition_name
        var competition_id = xhr?.response?.data?.competition_id
        if (!competition_id) {
            msg = `competition_id 获取失败(${xhr?.response})`
            GM_notification(msg)
            GM_log(msg, labels)
            return
        }

        // 获取未消除 bug 数
        obj.url = bugCountUrl
        obj.data = JSON.stringify({ competition_id: competition_id })
        xhr = await response(obj, title)
        var bugCounts = xhr?.response?.data?.user_own_bug
        console.log("未消除bug数:", bugCounts)

        // 获取 bug 信息
        obj.url = bugInfoUrl
        obj.data = JSON.stringify({})
        xhr = await response(obj, title)
        var bugList = xhr?.response?.data
        // console.log("bugList:", bugList)

        // 消除 bug
        var successCount = 0;  // 成功消除 bug 数
        var tempStr = ""
        for (const element of bugList) {
            var bug_time = element.bug_time
            var bug_type = element.bug_type
            console.log(bug_time, bug_type)
            obj.url = bugUrl
            obj.data = JSON.stringify({ bug_time: bug_time, bug_type: bug_type })
            xhr = await response(obj, title)

            switch (xhr?.response.err_on) {

                // { "err_no": 0, "err_msg": "success", "data": null }
                // { "err_no": 20003, "err_msg": "bug not exsit", "data": null }
                // { "err_no": 20004, "err_msg": "bug already collect", "data": null }
                case 0:
                    successCount += 1
                    GM_log(`${title}💭bug 消除: ` + JSON.stringify(xhr?.response?.err_msg), 'info')
                    break
                case 20003:
                    GM_log(`${title}💢bug 消除: ` + JSON.stringify(xhr?.response?.err_msg), 'info')
                    break
                case 20004:
                    GM_log(`${title}💢bug 消除: ` + JSON.stringify(xhr?.response?.err_msg), 'info')
                    break
                default:
                    msg = `${title}💢未知状态码，请查看日志响应信息`
                    GM_log(`${title}💢未知状态码响应信息: ` + JSON.stringify(xhr?.response), 'warn')
                    GM_notification(msg)
            }
            tempStr == "" ? tempStr = xhr.response.err_msg : tempStr += "\n" + xhr.response.err_msg

        }

        msg = `${title}Bug Fix-${competition_name}(${successCount}/${bugList.length})\n消除日志:${tempStr}`
        GM_notification(msg)
        GM_log(msg, "info")
    }
}
