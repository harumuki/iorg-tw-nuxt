const got = require('got')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config()

const apiKey = process.env.AIRTABLE_API_KEY

const edgeCategories = [
  {
    id: 'command',
    keywords: ['上級', '組長', '所屬', '主管', '里長', '母集團', '主導', '主任', '領導']
  }
]

const linkCats = {
  command: 'command'
}

async function getList(listName) {
  let list = []
  let offset = 0
  while(offset !== '' && offset !== null && offset !== undefined) {
    const url = `https://api.airtable.com/v0/appu0MNR57XsXL8P6/${listName}?offset=${offset ? offset : ''}&api_key=${apiKey}`
    let res = await got(url)
    res = JSON.parse(res.body)
    list = list.concat(res.records)
    offset = res.offset
  }
  return list
}

async function get() {
  let allDomains
  let allNodes
  let allEdges
  try {
    allDomains = await getList('domains')
    allNodes = await getList('nodes')
    allEdges = await getList('edges')
  } catch(error) {
    console.error(error)
  }

  let domainMap = Object.assign({}, ...allDomains.map(d => ({ [d.id]: d.fields.name })))
  allDomains = Object.values(domainMap)
  allDomains.push(...edgeCategories.map(c => c.id))

  allDomains.sort((a, b) => {
    const p = +a.substring(1)
    const q = +b.substring(1)
    return !Number.isNaN(p) && !Number.isNaN(q) ? p - q : (a > b ? 1 : (a < b ? -1 : 0))
  })

  allNodes = allNodes.filter(d => d.id && d.fields && d.fields.short_name).map(d => {
    const category = d.fields.category ? d.fields.category : 'default'
    const notes = d.fields.notes ? d.fields.notes.trim() : null
    let group = 'none'
    if(['中國', '中共'].some(s => category.includes(s))) {
      group = '中國'
    } else if(category.includes('台灣')) {
      group = '台灣'
    } else if(category.includes('香港')) {
      group = '香港'
    } else if(category.includes('美國')) {
      group = '美國'
    } else if(category === '論壇') {
      group = '論壇'
    }
    return {
      id: d.id,
      name: d.fields.short_name,
      category,
      group,
      notes,
      degree: 0
    }
  })

  allEdges = allEdges.filter(d => d.fields && Array.isArray(d.fields.from) && d.fields.from.length > 0 && Array.isArray(d.fields.to) && d.fields.to.length > 0 && d.fields.action).map(d => {
    let action = d.fields.action
    let domains = d.fields.domains ? d.fields.domains.map(d => domainMap[d]) : []
    let category = 'default'
    for(const cat of edgeCategories) {
      if(cat.keywords.some(k => action.includes(k))) {
        category = cat.id
      }
    }
    let notes = d.fields.notes ? d.fields.notes.trim() : null
    return {
      id: d.id,
      source: d.fields.from ? d.fields.from[0] : null,
      target: d.fields.to ? d.fields.to[0] : null,
      action,
      category,
      domains,
      notes
    }
  })

  for(const node of allNodes) {
    node.degree += allEdges.filter(edge => edge.source === node.id).length
    node.degree += allEdges.filter(edge => edge.target === node.id).length
  }

  for(const domain of allDomains) {
    const edges = allEdges.filter(edge => edge.domains.some(d => d === domain))

    // trace up the command chain
    const linkedNodes = edges.map(edge => [edge.source, edge.target]).flat()
    let nc = 0
    for(const n of linkedNodes) {
      const commandingEdges = allEdges.filter(l => l.category === linkCats.command && l.target === n)
      for(const edge of commandingEdges) {
        const m = edge.source
        linkedNodes.push(m)
      }
      edges.push(...commandingEdges)
      nc += 1
    }

    for(const edge of edges) {
      edge.domains.push(domain)
    }
  }

  try {
    fs.writeFileSync('data/ion/domains.json', JSON.stringify(allDomains, null, '\t'))
    fs.writeFileSync('data/ion/nodes.json', JSON.stringify(allNodes, null, '\t'))
    fs.writeFileSync('data/ion/edges.json', JSON.stringify(allEdges, null, '\t'))
  } catch(error) {
    console.error(error)
  }
}

get()
