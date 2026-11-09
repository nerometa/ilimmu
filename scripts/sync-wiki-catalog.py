"""Refresh and normalize the public Genshin Impact Wiki snapshot.

Run python3 scripts/sync-wiki-catalog.py --refresh to refetch Wiki responses.
Without --refresh, normalize the checked-in cache without network access.
Only --apply writes the active catalog. The script never writes personal data.
"""
import argparse, datetime, hashlib, html, json, pathlib, re, subprocess, unicodedata
from html.parser import HTMLParser
from urllib.parse import urlencode, quote

ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'src/lib/game/wiki-cache'
BASE='https://genshin-impact.fandom.com'
FETCH_LOG={}

class Node:
    def __init__(self, tag='', attrs=()):self.tag=tag;self.attrs=dict(attrs);self.children=[]
    def text(self):return ''.join(c if isinstance(c,str) else c.text() for c in self.children)
    def find(self,tag):
        result=[]
        for c in self.children:
            if isinstance(c,Node):
                if c.tag==tag:result.append(c)
                result.extend(c.find(tag))
        return result
class Document(HTMLParser):
    def __init__(self,source):
        super().__init__(convert_charrefs=True);self.root=Node();self.stack=[self.root];self.feed(source)
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs);self.stack[-1].children.append(n)
        if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(n)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:self.stack=self.stack[:i];return
    def handle_data(self,data):self.stack[-1].children.append(data)

def clean(value):
    value=html.unescape(value).replace('\u00ad','').replace('\u200b','')
    return re.sub(r'\s+',' ',value).strip()
def key(value):return unicodedata.normalize('NFKC',clean(value)).replace('’',"'").casefold()
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def fetch(cache,params,refresh):
    path=CACHE/cache
    url=BASE+'/api.php?'+urlencode({'format':'json',**params})
    fetched=refresh or not path.exists()
    if fetched:
        data=json.loads(subprocess.check_output(['curl','-sSL','--fail','--retry','1','--max-time','35',url]))
        if 'error' in data:raise RuntimeError(f'{cache}: {data["error"]}')
        write(path,data)
    if fetched or cache not in FETCH_LOG:
        when=datetime.datetime.now(datetime.timezone.utc) if fetched else datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc)
        FETCH_LOG[cache]={'url':url,'retrievedAt':when.isoformat(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    return json.loads(path.read_text())
def info(data):
    p=data['parse'];return {'title':p['title'],'pageId':p['pageid'],'revisionId':p['revid'],'url':BASE+'/wiki/'+quote(p['title'].replace(' ','_'),safe='/'),'sha256':hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()}
def rows(data):
    doc=Document(data['parse']['text']['*']).root
    result=[]
    for table in doc.find('table'):
        if 'wikitable' not in table.attrs.get('class',''):continue
        for row in table.find('tr'):
            cells=[c for c in row.children if isinstance(c,Node) and c.tag in ['td','th']]
            if cells:result.append(cells)
    return result

def image(cell):
    for img in cell.find('img'):
        url=img.attrs.get('data-src') or img.attrs.get('src','')
        if url.startswith('https://static.wikia.nocookie.net/'):
            return re.sub(r'/revision/.*','',url)
    return ''

def artifact_rows(data,ids):
    out=[];unknown=[]
    for cells in rows(data):
        if len(cells)!=4 or cells[0].tag=='th':continue
        name=clean(cells[0].text());gameid=ids.get(key(name))
        if gameid is None:unknown.append(name);continue
        bonuses=clean(cells[3].text())
        two=re.search(r'2-Piece:\s*(.*?)(?=4-Piece:|$)',bonuses)
        four=re.search(r'4-Piece:\s*(.*)$',bonuses)
        rarities=[int(x) for x in re.findall(r'\d',clean(cells[1].text()))]
        out.append({'id':gameid,'name':name,'rarity':max(rarities),'effect2':two[1].strip() if two else '', 'effect4':four[1].strip() if four else '', 'image':image(cells[2]),'wikiUrl':BASE+'/wiki/'+quote(name.replace(' ','_'),safe='/'),'sourceRevision':data['parse']['revid']})
    return out,unknown

def table_cells(table):
    for row in table.find('tr'):
        cells=[c for c in row.children if isinstance(c,Node) and c.tag in ['td','th']]
        if cells:yield cells

def matching_tables(data,marker):
    for table in Document(data['parse']['text']['*']).root.find('table'):
        entries=list(table_cells(table))
        if entries and any(marker in clean(cell.text()) for cell in entries[0]):yield entries

def quality(cell):
    for item in cell.find('img'):
        match=re.search(r'(\d) Stars?',item.attrs.get('alt',''))
        if match:return int(match[1])
    raise RuntimeError('Missing Wiki rarity icon')

def weapon_rows(data,ids,types):
    out=[];unknown=[]
    # The first list contains current equipment; later lists cover event/unused items.
    entries=next(matching_tables(data,'Passive Ability'))
    for cells in entries[1:]:
        if len(cells)!=6:continue
        name=clean(cells[1].text());gameid=ids.get(key(name))
        if gameid is None:unknown.append(name);continue
        attack=re.match(r'(\d+)',clean(cells[3].text()))
        stat=clean(cells[4].text());maxstat=stat.split('(')[0].strip()
        stattype=re.sub(r'\s+[\d.,]+%?$', '',maxstat).strip()
        passive=clean(cells[5].text())
        title=next((clean(n.text()) for n in cells[5].children if isinstance(n,Node) and n.tag=='b'),'')
        if title and passive.startswith(title):passive=passive[len(title):].strip()
        out.append({'id':gameid,'name':name,'rarity':quality(cells[2]),'weaponType':types.get(key(name),''),'stat':stattype,'maxAtk':int(attack[1]) if attack else None,'maxStat':maxstat,'effect':passive,'effectName':title,'image':image(cells[0]),'wikiUrl':BASE+'/wiki/'+quote(name.replace(' ','_'),safe='/'),'sourceRevision':data['parse']['revid']})
    return out,unknown

def character_rows(data,ids):
    out=[];unknown=[]
    entries=next(matching_tables(data,'Weapon'))
    for cells in entries[1:]:
        if len(cells)!=7:continue
        name=clean(cells[1].text())
        gameid=10000005 if name=='Traveler' else ids.get(key(name))
        if gameid is None:unknown.append(name);continue
        out.append({'id':gameid,'name':name,'rarity':quality(cells[2]),'element':clean(cells[3].text()),'weaponType':clean(cells[4].text()),'region':clean(cells[5].text()),'image':image(cells[0]),'wikiUrl':BASE+'/wiki/'+quote(name.replace(' ','_'),safe='/'),'sourceRevision':data['parse']['revid']})
    return out,unknown

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--refresh',action='store_true');parser.add_argument('--apply',action='store_true',help='Apply the reviewed normalized snapshot to the local application catalog');parser.add_argument('--download-art',action='store_true',help='Cache missing Wiki artwork and official slot icons');args=parser.parse_args()
    CACHE.mkdir(parents=True,exist_ok=True)
    log_path=CACHE/'fetch-log.json'
    if log_path.exists():FETCH_LOG.update(json.loads(log_path.read_text()))
    ids=json.loads((CACHE/'stable-ids.json').read_text())
    source={};data={}
    for category,page in [('artifact-sets','Artifact/Sets'),('characters','Character'),('weapons','Weapon/List')]:
        data[category]=fetch(category+'.json',{'action':'parse','page':page,'prop':'text|revid|images'},args.refresh)
        source[category]=info(data[category])
    artifacts,unmapped=artifact_rows(data['artifact-sets'],{key(k):v for k,v in ids['artifacts'].items()})
    if len(artifacts)<55:raise RuntimeError(f'Incomplete artifact snapshot: only {len(artifacts)} sets')
    write(pathlib.Path('/tmp/wiki-catalog.json'),{'artifacts':sorted(artifacts,key=lambda a:a['name']),'unmappedArtifacts':unmapped})
    types={}
    for weapon_type in ['Sword','Claymore','Polearm','Catalyst','Bow']:
        typedata=fetch(weapon_type.lower()+'.json',{'action':'parse','page':weapon_type,'prop':'text|revid'},args.refresh)
        source[weapon_type.lower()]=info(typedata)
        for entries in matching_tables(typedata,'Passive Ability'):
            for cells in entries[1:]:
                if len(cells)==6:types[key(clean(cells[1].text()))]=weapon_type
    weapons,unknown_weapons=weapon_rows(data['weapons'],{key(k):v for k,v in ids['weapons'].items()},types)
    characters,unknown_characters=character_rows(data['characters'],{key(k):v for k,v in ids['characters'].items()})
    if len(weapons)<240 or len(characters)<115:raise RuntimeError('Incomplete Wiki character or weapon list')
    unexpected={'artifacts':[n for n in unmapped if n!='Initiate'],'weapons':unknown_weapons,'characters':[n for n in unknown_characters if n!='Wonderland Manekin']}
    if any(unexpected.values()):raise RuntimeError('New Wiki identities need reviewed stable game IDs: '+json.dumps(unexpected))
    normalized={'artifacts':sorted(artifacts,key=lambda a:a['name']),'weapons':sorted(weapons,key=lambda a:a['name']),'characters':sorted(characters,key=lambda a:a['name'])}
    write(pathlib.Path('/tmp/wiki-weapons.json'),normalized['weapons'])
    write(pathlib.Path('/tmp/wiki-characters.json'),normalized['characters'])
    write(CACHE/'normalized.json',normalized)
    entity_revisions={}
    all_titles=list(dict.fromkeys(item['name'] for items in normalized.values() for item in items))
    for offset in range(0,len(all_titles),50):
        revision_data=fetch(f'entity-revisions-{offset//50:02d}.json',{'action':'query','titles':'|'.join(all_titles[offset:offset+50]),'prop':'revisions','rvprop':'ids|timestamp','redirects':'1'},args.refresh)
        for page in revision_data.get('query',{}).get('pages',{}).values():
            revisions=page.get('revisions',[])
            if revisions:entity_revisions[key(page['title'])]={'pageId':page['pageid'],'revisionId':revisions[0]['revid'],'timestamp':revisions[0]['timestamp']}
    for items in normalized.values():
        for item in items:
            item.update(entity_revisions.get(key(item['name']),{}))
    write(CACHE/'normalized.json',normalized)
    write(pathlib.Path('/tmp/wiki-catalog.json'),{'artifacts':normalized['artifacts'],'unmappedArtifacts':unmapped})
    write(pathlib.Path('/tmp/wiki-weapons.json'),normalized['weapons'])
    write(pathlib.Path('/tmp/wiki-characters.json'),normalized['characters'])
    icons=fetch('slot-icons.json',{'action':'query','titles':'File:Icon_Circlet_of_Logos.png|File:Icon_Sands_of_Eon.png|File:Icon_Goblet_of_Eonothem.png','prop':'imageinfo','iiprop':'url|timestamp'},args.refresh)
    assets=[]
    for icon in icons['query']['pages'].values():
        slot='sands' if 'Sands' in icon['title'] else 'goblet' if 'Goblet' in icon['title'] else 'circlet'
        assets.append({'file':'slot-'+slot+'.png','wikiPageId':icon['pageid'],'source':icon['imageinfo'][0]['url'],'imageTimestamp':icon['imageinfo'][0]['timestamp']})
    if args.download_art:
        from concurrent.futures import ThreadPoolExecutor
        jobs=[(ROOT/'static/game'/a['file'],a['source']) for a in assets]
        jobs.extend((ROOT/f'static/game/{kind}-{item["id"]}.png',item['image']) for kind,items in normalized.items() for item in items if item['image'])
        def download(job):
            path,url=job
            if path.exists():return
            temporary=path.with_suffix('.download')
            result=subprocess.run(['curl','-sSL','--fail','--retry','1','--max-time','25','-o',str(temporary),url],capture_output=True)
            if result.returncode==0:temporary.replace(path)
            else:
                temporary.unlink(missing_ok=True)
                print('Artwork unavailable: '+url)
        with ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(download,jobs))
    metadata={'schemaVersion':1,'authority':'Genshin Impact Wiki','retrievedAt':max(record['retrievedAt'] for record in FETCH_LOG.values()),'sources':source,'entityRevisionCount':len(entity_revisions),'slotIcons':assets,'travelerImage':{'file':'traveler.webp','source':'https://ggartifact.com/character/traveler.webp','providedByUser':True},'counts':{k:len(v) for k,v in normalized.items()},'unmappedArtifacts':unmapped,'unmappedWeapons':unknown_weapons,'unmappedCharacters':unknown_characters,'notes':['Game IDs are stable application joins, not Wiki page IDs.','Missing artwork never removes a catalog entry.','Wiki page HTML is cached to make the normalized data reviewable and reproducible.']}
    if args.apply:
        active=ROOT/'src/lib/game/catalog.json'
        aliases_path=ROOT/'src/lib/game/legacy-effects.json'
        aliases=json.loads(aliases_path.read_text()) if aliases_path.exists() else {}
        if active.exists():
            for item in json.loads(active.read_text())['artifacts']:
                if item.get('effect2'):aliases.setdefault(item['effect2'],item['id'])
        write(aliases_path,aliases)
        # App-specific variant IDs; keep legacy Aether/Lumine joins for Anemo.
        traveler_ids = {'Anemo': 10000005, 'Geo': 90000001,
                        'Electro': 90000002, 'Dendro': 90000003,
                        'Hydro': 90000004, 'Pyro': 90000005, 'Cryo': 90000006}
        projected = []
        for character in normalized['characters']:
            if character['id'] == 10000005:
                projected.extend({**character, 'id': variant_id,
                                  'name': f'Traveler ({element})', 'element': element}
                                 for element, variant_id in traveler_ids.items())
            else:
                projected.append(character)
        write(active, {**normalized, 'characters': sorted(projected, key=lambda c: c['name'])})
    write(CACHE/'fetch-log.json',FETCH_LOG)
    write(ROOT/'src/lib/game/wiki-source.json',metadata)
    print(json.dumps({'counts':metadata['counts'],'unmappedArtifacts':unmapped,'unmappedWeapons':unknown_weapons,'unmappedCharacters':unknown_characters}))
if __name__=='__main__':main()
