import '../stylesheets/style.scss'
import Dexie from 'dexie'
import Service from './service'

import card from './card.hbs'
import info from './info.hbs'

let searchForm = document.forms.search
let bannerBlock = document.querySelector('.banner')
let searchField = document.querySelector('.search__field')
let resultInfo = document.querySelector('.banner__result')
let resultList = document.querySelector('.event-list__items')
let resultSection = document.querySelector('.event-list')
let eventLinks = document.querySelectorAll('.card-event__link')
let eventInfo = document.querySelector('.event-info')
let spinner = document.querySelector('.spinner__wrap')

const data = new Service()

let db = new Dexie('store')
db.version(1).stores({
    events: 'id'
})

let transformData = (data) => {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let findImages = (images) => {
        return {
            smallImage: images.find((i)=>i.width >= 350 && i.width <= 1000).url,  
            bigImage: images.find((i)=>i.width > 2000).url
        }
    }
    if(Array.isArray(data)) {
        let newData = data.map((item) => {
            let date = new Date(item.dates.start.dateTime)
            return {
                id: item.id,
                name: item.name,
                genre: item.classifications[0].segment.name,
                shortDate: `${date.getDate()?`${date.getDate()} ${months[date.getMonth()]}`:''}`,
                eventImages: findImages(item.images),
                priceRange: item.priceRanges? item.priceRanges[0]: '',
                place: item._embedded.venues[0].name
            }
        })
        return newData
    }
    else {
        let date = new Date(data.dates.start.dateTime)
        return {
            id: data.id,
            name: data.name,
            genre: data.classifications[0].segment.name,
            shortDate: `${date.getDate()?`${date.getDate()} ${months[date.getMonth()]}`:''}`,
            fullDate: `${date.getDate()?`${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`:'' }`,
            time: `${date.getUTCHours()}:00`,
            status: data.dates.status.code,
            eventImages: findImages(data.images),
            priceRange: data.priceRanges? data.priceRanges[0]: '',
            place: data._embedded.venues[0].name,
            country: data._embedded.venues[0].country.name,
            url: data.url
        }
    }
    
}

let loadMoreMarkup = (link) => {
    return `<div class="load-wrap">
        <a href="${link}" class="load-wrap__link">Load more</a>
    </div>`
}

let loadMore = (string) => {
    let newString = string.replace('/events', `/events${data._apiKey}`).replace('?locale', '&locale').replace('?keyword', '&keyword')
    
    data.getMore(`https://app.ticketmaster.com${newString}`)
    .then(data => {
        let oldButton = document.querySelector('.load-wrap')
        oldButton.parentNode.removeChild(oldButton)
        resultList.insertAdjacentHTML('beforeend',card({events: transformData(data._embedded.events)}))
        spinner.classList.remove('show')
        if('next' in data._links) {
            resultList.insertAdjacentHTML('beforeend', loadMoreMarkup(data._links.next.href))
        }
    })
}

let showResult = () => {
    eventInfo.classList.add('show')
    document.body.style.overflowY='hidden'
    let btnCloseInfo = document.querySelector('.info-banner__close')
    btnCloseInfo.addEventListener('click', ()=> {
        eventInfo.classList.remove('show')
        setTimeout(() => {
            eventInfo.innerHTML=''
        },500)
        document.body.style.overflowY='auto'
    })
}

let emptyResult = (text) => {
    resultInfo.innerHTML= text
    resultInfo.style.visibility='visible'
    resultList.innerHTML = ''
    bannerBlock.classList.remove('small')
    resultSection.classList.remove('show')
    spinner.classList.remove('show')
}

resultSection.addEventListener('click', (event) => {
    event.preventDefault()
    spinner.classList.add('show')
    if(event.target.classList.contains('card-event__link')) {
        let idEvent = event.target.getAttribute('href')
            db.events.get(idEvent)
                .then ((event) => {
                    if(event) {
                        eventInfo.insertAdjacentHTML('afterbegin', info(event))
                        spinner.classList.remove('show')
                        showResult()
                    } else {
                        data.getEvent(idEvent)
                            .then(data => {
                                db.events.add(transformData(data)) 
                                eventInfo.insertAdjacentHTML('afterbegin', info(transformData(data)))
                                spinner.classList.remove('show')
                                showResult()
                            })
                    }
                })
    }
    if(event.target.classList.contains('load-wrap__link')) {
        loadMore(event.target.getAttribute('href'))
        
    }
})

searchForm.addEventListener('submit', (event) => {
    event.preventDefault()
    spinner.classList.add('show')
    if(searchForm.elements[0].value == '') {
        emptyResult('Enter your query')
    } else {    
        data.searchEvents(searchForm.elements[0].value.replace(/\s/gi, '%20'),12)
            .then(data => {
                if(data.page.totalElements) {
                    resultList.innerHTML = ''
                    resultInfo.innerHTML= `Finded ${data.page.totalElements} results`
                    resultInfo.style.visibility='visible'
                    resultList.insertAdjacentHTML('afterbegin', card({events: transformData(data._embedded.events)}))
                    resultList.insertAdjacentHTML('beforeend', loadMoreMarkup(data._links.next.href))
                    bannerBlock.classList.add('small')
                    resultSection.classList.add('show')
                    spinner.classList.remove('show')
                } else {
                    emptyResult('Nothing found')
                }
            },
            error => {
                emptyResult('Nothing found')
            })
    }
})

