export default class Service {

    _basePath = 'https://app.ticketmaster.com/discovery/v2/'
    _apiKey = '?apikey=7elxdku9GGG5k8j0Xm8KWdANDgecHMV0'
   
    async getData(path,id,string,size) {
        
        const result = await fetch(`${this._basePath}${path}${id?id:''}${this._apiKey}${string?`&keyword=${string}`:''}&locale=*${size?`&size=${size}`:''}`)

        if(!result.ok) {
            throw new Error(`Could not fetch ${path}, received ${result.status}`)
        }
        return await result.json()
    }

    async searchEvents(string,size) {
        return await this.getData('events', '', string, size)
    }

    async getEvent(id) {
        return await this.getData('events/',id)
    }

    // async getAttractions() {
    //     return await this.getData('attractions').then(data =>data._embedded.attractions)
    // }

    async getMore(string) {
        const result = await fetch(string)
        if(!result.ok) {
            throw new Error(`Could not fetch ${string}, received ${result.status}`)
        }
        return await result.json()
    }
}