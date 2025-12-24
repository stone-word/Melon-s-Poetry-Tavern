/**
 * 英文名字库（男女分开）及随机生成器
 */
export const MALE_ENGLISH_NAMES = [
  'Liam','Noah','Oliver','Elijah','James','William','Benjamin','Lucas','Henry','Alexander',
  'Mason','Michael','Ethan','Daniel','Jacob','Logan','Jackson','Levi','Sebastian','Mateo',
  'Jack','Owen','Theodore','Aiden','Samuel','Joseph','John','David','Wyatt','Matthew',
  'Luke','Asher','Carter','Julian','Grayson','Leo','Jayden','Gabriel','Isaac','Lincoln',
  'Anthony','Hudson','Dylan','Ezra','Thomas','Charles','Christopher','Jaxon','Maverick','Josiah'
];

export const FEMALE_ENGLISH_NAMES = [
  'Olivia','Emma','Ava','Charlotte','Sophia','Amelia','Isabella','Mia','Evelyn','Harper',
  'Camila','Gianna','Abigail','Luna','Ella','Elizabeth','Sofia','Emily','Avery','Mila',
  'Scarlett','Eleanor','Madison','Layla','Penelope','Aria','Chloe','Grace','Ellie','Nora',
  'Hazel','Zoey','Riley','Victoria','Lily','Aurora','Violet','Nova','Hannah','Emilia',
  'Zoe','Stella','Everly','Isla','Leah','Lillian','Addison','Willow','Lucy','Paisley'
];

export type EnglishGender = 'male' | 'female' | 'any';

export function getRandomEnglishName(gender: EnglishGender = 'any'): string {
  let pool: string[];
  if (gender === 'male') pool = MALE_ENGLISH_NAMES;
  else if (gender === 'female') pool = FEMALE_ENGLISH_NAMES;
  else pool = MALE_ENGLISH_NAMES.concat(FEMALE_ENGLISH_NAMES);

  return pool[Math.floor(Math.random() * pool.length)];
}

export default getRandomEnglishName;
