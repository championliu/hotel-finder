import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Star, Phone, Mail, MapPin, X, Copy, ExternalLink,
  ChevronUp, ChevronDown, Hotel, Globe, Calendar, Users, Layers,
} from 'lucide-react';

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap';
document.head.appendChild(fontLink);

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.HOTEL_FINDER_API_BASE) ||
  'http://localhost:8787';

const ROOM_TYPE_CATALOG = [
  { id: 'single', label: 'Single Room',    labelLocal: '單人房',      capacity: 1 },
  { id: 'double', label: 'Double Room',    labelLocal: '雙人房',      capacity: 2 },
  { id: 'triple', label: 'Triple Room',    labelLocal: '三人房',      capacity: 3 },
  { id: 'quad',   label: '4-Person Room',  labelLocal: '四人房',      capacity: 4 },
  { id: 'family', label: 'Family Room',    labelLocal: '家庭房 (6人)', capacity: 6 },
];

const HOTEL_KEYWORDS = ['hotel', 'luxury hotel', 'budget hotel', 'hostel', 'boutique hotel', 'apartment'];

const SNOWFLAKES = ['❄', '❅', '❆'];

// ─── Demo Dataset ─────────────────────────────────────────────────────────────
const DEMO_DATASET = [
  {
    aliases: ['echigo-yuzawa', 'yuzawa', '湯沢', '越後湯沢', 'echigo yuzawa'],
    label: 'Echigo-Yuzawa',
    anchor: { lat: 36.9315, lng: 138.8133, label: 'Echigo-Yuzawa Station' },
    hotels: [
      { name: 'Hotel Yuzawa Grand', nameLocal: 'ホテル湯沢グランド', lat: 36.9320, lng: 138.8140, google: 4.3, reviewCount: 412, phone: '+81-25-785-2000', placeId: 'ChIJyuzawa001grand', roomTypes: ['Standard Room','Deluxe Room','Family Room'], image: '🏨', address: '1-1 Yuzawa, Minami-Uonuma, Niigata' },
      { name: 'Ryokan Yukiguni', nameLocal: '旅館雪国', lat: 36.9298, lng: 138.8112, google: 4.6, reviewCount: 287, phone: '+81-25-785-3100', placeId: 'ChIJyuzawa002ryokan', roomTypes: ['Japanese Suite','Standard Room'], image: '🏯', address: '3-5 Yuzawa, Minami-Uonuma, Niigata' },
      { name: 'Pension Snowfield', nameLocal: 'ペンション スノーフィールド', lat: 36.9335, lng: 138.8155, google: 4.1, reviewCount: 156, phone: '+81-25-785-4200', placeId: 'ChIJyuzawa003pension', roomTypes: ['Single Room','Double Room'], image: '🏠', address: '7-2 Yuzawa, Minami-Uonuma, Niigata' },
      { name: 'Naspa New Otani', nameLocal: 'ナスパ ニューオータニ', lat: 36.9280, lng: 138.8090, google: 4.5, reviewCount: 634, phone: '+81-25-788-0111', placeId: 'ChIJyuzawa004naspa', roomTypes: ['Standard Room','Deluxe Room','Suite'], image: '🌟', address: 'Yuzawa, Minami-Uonuma, Niigata 949-6101' },
      { name: 'Takahan Ryokan', nameLocal: '高半旅館', lat: 36.9345, lng: 138.8175, google: 4.7, reviewCount: 198, phone: '+81-25-784-3151', placeId: 'ChIJyuzawa005takahan', roomTypes: ['Japanese Room','Deluxe Japanese Room'], image: '🎋', address: '923 Yuzawa, Minami-Uonuma, Niigata' },
    ],
  },
  {
    aliases: ['niseko', 'ニセコ', 'hirafu', '比羅夫', 'niseko village'],
    label: 'Niseko',
    anchor: { lat: 42.8100, lng: 140.6880, label: 'Niseko Grand Hirafu' },
    hotels: [
      { name: 'Park Hyatt Niseko Hanazono', nameLocal: 'パーク ハイアット ニセコ ハナゾノ', lat: 42.8215, lng: 140.7012, google: 4.8, reviewCount: 892, phone: '+81-136-23-1234', placeId: 'ChIJniseko001hyatt', roomTypes: ['Deluxe Room','Suite','Penthouse'], image: '⭐', address: '328 Aza-Hanazono, Kutchan, Abuta, Hokkaido' },
      { name: 'Hilton Niseko Village', nameLocal: 'ヒルトン ニセコビレッジ', lat: 42.8056, lng: 140.6934, google: 4.6, reviewCount: 1243, phone: '+81-136-44-1111', placeId: 'ChIJniseko002hilton', roomTypes: ['Standard Room','Deluxe Room','Family Room'], image: '🏔', address: 'Higashiyama Onsen, Kutchan, Abuta, Hokkaido' },
      { name: 'Green Leaf Niseko Village', nameLocal: 'ザ グリーンリーフ ニセコビレッジ', lat: 42.8061, lng: 140.6940, google: 4.5, reviewCount: 567, phone: '+81-136-44-3333', placeId: 'ChIJniseko003greenleaf', roomTypes: ['Studio','1BR Apartment','2BR Apartment'], image: '🌿', address: 'Higashiyama, Kutchan, Hokkaido 044-0081' },
      { name: 'Chatrium Niseko Japan', nameLocal: 'チャトリウム ニセコ ジャパン', lat: 42.8178, lng: 140.6889, google: 4.4, reviewCount: 334, phone: '+81-136-55-8800', placeId: 'ChIJniseko004chatrium', roomTypes: ['Double Room','Triple Room','4-Person Room'], image: '🏨', address: 'Aza-Yamada, Kutchan, Hokkaido' },
      { name: 'AYA Niseko', nameLocal: 'アヤ ニセコ', lat: 42.8134, lng: 140.6856, google: 4.7, reviewCount: 445, phone: '+81-136-21-6688', placeId: 'ChIJniseko005aya', roomTypes: ['Studio Loft','2BR Suite','3BR Penthouse'], image: '✨', address: '190-2 Aza-Yamada, Kutchan, Hokkaido' },
    ],
  },
  {
    aliases: ['hakuba', '白馬', 'hakuba valley', 'happo-one', 'happo one'],
    label: 'Hakuba',
    anchor: { lat: 36.6982, lng: 137.8602, label: 'Hakuba Village' },
    hotels: [
      { name: 'Hakuba Mominoki Hotel', nameLocal: '白馬もみの木ホテル', lat: 36.7012, lng: 137.8634, google: 4.4, reviewCount: 378, phone: '+81-261-72-2210', placeId: 'ChIJhakuba001mominoki', roomTypes: ['Standard Room','Deluxe Room','Family Room'], image: '🌲', address: '13680 Hokujyo, Hakuba, Kitaazumi, Nagano' },
      { name: 'The Loft Hakuba', nameLocal: 'ザ ロフト 白馬', lat: 36.6945, lng: 137.8578, google: 4.6, reviewCount: 234, phone: '+81-261-75-3500', placeId: 'ChIJhakuba002loft', roomTypes: ['Double Room','4-Person Room','Family Room'], image: '🏔', address: 'Hakuba, Kitaazumi, Nagano 399-9301' },
      { name: 'Mimosa Hakuba', nameLocal: 'ミモザ 白馬', lat: 36.6998, lng: 137.8615, google: 4.3, reviewCount: 189, phone: '+81-261-72-3456', placeId: 'ChIJhakuba003mimosa', roomTypes: ['Single Room','Double Room'], image: '🏠', address: '8 Hokujyo, Hakuba, Nagano' },
      { name: 'Cortina Hakuba', nameLocal: 'コルティナ 白馬', lat: 36.7089, lng: 137.8701, google: 4.7, reviewCount: 312, phone: '+81-261-75-2501', placeId: 'ChIJhakuba004cortina', roomTypes: ['Standard Room','Superior Room','Suite'], image: '❄', address: 'Norikura, Hakuba, Kitaazumi, Nagano' },
      { name: 'Hakuba 47 Mountain Lodge', nameLocal: '白馬47 マウンテンロッジ', lat: 36.6867, lng: 137.8523, google: 4.2, reviewCount: 156, phone: '+81-261-75-3233', placeId: 'ChIJhakuba005lodge', roomTypes: ['Triple Room','4-Person Room','Dormitory'], image: '⛷', address: '29714 Kamishiro, Hakuba, Nagano' },
    ],
  },
  {
    aliases: ['tokyo station', '東京駅', 'tokyo eki', 'marunouchi', 'tokyo'],
    label: 'Tokyo Station',
    anchor: { lat: 35.6812, lng: 139.7671, label: 'Tokyo Station' },
    hotels: [
      { name: 'Palace Hotel Tokyo', nameLocal: 'パレスホテル東京', lat: 35.6862, lng: 139.7581, google: 4.8, reviewCount: 3421, phone: '+81-3-3211-5211', placeId: 'ChIJtokyo001palace', roomTypes: ['Deluxe Room','Grand Deluxe','Suite'], image: '👑', address: '1-1-1 Marunouchi, Chiyoda, Tokyo 100-0005' },
      { name: 'The Tokyo Station Hotel', nameLocal: '東京ステーションホテル', lat: 35.6814, lng: 139.7665, google: 4.7, reviewCount: 2876, phone: '+81-3-5220-1111', placeId: 'ChIJtokyo002stationhotel', roomTypes: ['Standard Room','Deluxe Room','Executive Room'], image: '🏛', address: '1-9-1 Marunouchi, Chiyoda, Tokyo 100-0005' },
      { name: 'Marunouchi Hotel', nameLocal: '丸の内ホテル', lat: 35.6823, lng: 139.7645, google: 4.5, reviewCount: 1654, phone: '+81-3-3217-1111', placeId: 'ChIJtokyo003marunouchi', roomTypes: ['Superior Room','Deluxe Room','Suite'], image: '🏢', address: '1-6-3 Marunouchi, Chiyoda, Tokyo 100-0005' },
      { name: 'JR Kyushu Hotel Blossom Tokyo', nameLocal: 'JR九州ホテルブラッサム東京', lat: 35.6845, lng: 139.7701, google: 4.3, reviewCount: 987, phone: '+81-3-3212-1111', placeId: 'ChIJtokyo004blossom', roomTypes: ['Standard Room','Superior Room'], image: '🌸', address: '1-1-2 Kanda-Awajicho, Chiyoda, Tokyo' },
      { name: 'Aman Tokyo', nameLocal: 'アマン東京', lat: 35.6874, lng: 139.7578, google: 4.9, reviewCount: 1243, phone: '+81-3-5224-3333', placeId: 'ChIJtokyo005aman', roomTypes: ['Aman Suite','Premier Suite','Aman Suite Pool'], image: '🌸', address: 'Otemachi Tower, 1-5-6 Otemachi, Chiyoda, Tokyo' },
      { name: 'Tokyu Stay Shin-Marunouchi', nameLocal: '東急ステイ 新丸の内', lat: 35.6831, lng: 139.7659, google: 4.2, reviewCount: 765, phone: '+81-3-3211-3109', placeId: 'ChIJtokyo006tokyu', roomTypes: ['Single Room','Double Room','Triple Room'], image: '🏨', address: '1-5-1 Marunouchi, Chiyoda, Tokyo' },
    ],
  },
  {
    aliases: ['shinjuku', '新宿', 'shinjuku station', 'kabukicho'],
    label: 'Shinjuku',
    anchor: { lat: 35.6896, lng: 139.7006, label: 'Shinjuku Station' },
    hotels: [
      { name: 'Park Hyatt Tokyo', nameLocal: 'パークハイアット東京', lat: 35.6855, lng: 139.6923, google: 4.8, reviewCount: 4532, phone: '+81-3-5322-1234', placeId: 'ChIJshinjuku001parkhyatt', roomTypes: ['Park Room','Deluxe Room','Park Suite'], image: '🌆', address: '3-7-1-2 Nishi-Shinjuku, Shinjuku, Tokyo 163-1055' },
      { name: 'Keio Plaza Hotel Tokyo', nameLocal: '京王プラザホテル', lat: 35.6924, lng: 139.6934, google: 4.5, reviewCount: 3876, phone: '+81-3-3344-0111', placeId: 'ChIJshinjuku002keio', roomTypes: ['Standard Room','Superior Room','Executive Room'], image: '🏙', address: '2-2-1 Nishi-Shinjuku, Shinjuku, Tokyo 160-8330' },
      { name: 'Hyatt Regency Tokyo', nameLocal: 'ハイアット リージェンシー 東京', lat: 35.6912, lng: 139.6941, google: 4.6, reviewCount: 2341, phone: '+81-3-3348-1234', placeId: 'ChIJshinjuku003hyatt', roomTypes: ['King Room','Twin Room','Suite'], image: '🌇', address: '2-7-2 Nishi-Shinjuku, Shinjuku, Tokyo 160-0023' },
      { name: 'Shinjuku Washington Hotel', nameLocal: '新宿ワシントンホテル', lat: 35.6889, lng: 139.6956, google: 4.1, reviewCount: 2109, phone: '+81-3-3343-3111', placeId: 'ChIJshinjuku004washington', roomTypes: ['Single Room','Double Room','Triple Room'], image: '🏨', address: '3-2-9 Nishi-Shinjuku, Shinjuku, Tokyo 160-0023' },
      { name: 'Citadines Shinjuku Tokyo', nameLocal: 'シタディーン新宿東京', lat: 35.6934, lng: 139.7023, google: 4.3, reviewCount: 876, phone: '+81-3-3232-1111', placeId: 'ChIJshinjuku005citadines', roomTypes: ['Studio','1BR Apartment','2BR Apartment'], image: '🏠', address: '2-6-1 Kabukicho, Shinjuku, Tokyo 160-0021' },
    ],
  },
  {
    aliases: ['kyoto station', '京都駅', 'kyoto eki', 'kyoto'],
    label: 'Kyoto Station',
    anchor: { lat: 34.9858, lng: 135.7588, label: 'Kyoto Station' },
    hotels: [
      { name: 'The Thousand Kyoto', nameLocal: 'ザ・千 京都', lat: 34.9876, lng: 135.7594, google: 4.7, reviewCount: 1876, phone: '+81-75-354-1000', placeId: 'ChIJkyoto001thousand', roomTypes: ['Deluxe Room','Premium Room','Suite'], image: '🌸', address: '581-1 Higashishiokojicho, Shimogyo, Kyoto 600-8216' },
      { name: 'Hotel Granvia Kyoto', nameLocal: 'ホテルグランヴィア京都', lat: 34.9851, lng: 135.7589, google: 4.5, reviewCount: 3241, phone: '+81-75-344-8888', placeId: 'ChIJkyoto002granvia', roomTypes: ['Standard Room','Superior Room','Executive Room'], image: '🏛', address: 'Karasuma-dori, Shiokoji-sagaru, Shimogyo, Kyoto' },
      { name: 'Kyoto Tokyu Hotel', nameLocal: '京都東急ホテル', lat: 34.9823, lng: 135.7545, google: 4.4, reviewCount: 1432, phone: '+81-75-341-2411', placeId: 'ChIJkyoto003tokyu', roomTypes: ['Standard Room','Twin Room','Triple Room'], image: '🗼', address: '31 Nishikujokaramachi, Minami, Kyoto 601-8412' },
      { name: 'Dormy Inn Premium Kyoto Ekimae', nameLocal: 'ドーミーインPREMIUM京都駅前', lat: 34.9841, lng: 135.7572, google: 4.6, reviewCount: 2109, phone: '+81-75-371-5489', placeId: 'ChIJkyoto004dormy', roomTypes: ['Single Room','Double Room','Triple Room'], image: '♨', address: '558-8 Higashishiokojicho, Shimogyo, Kyoto 600-8215' },
      { name: 'Rihga Royal Hotel Kyoto', nameLocal: 'リーガロイヤルホテル京都', lat: 34.9867, lng: 135.7612, google: 4.4, reviewCount: 1876, phone: '+81-75-341-1121', placeId: 'ChIJkyoto005rihga', roomTypes: ['Standard Room','Superior Room','Suite'], image: '🏯', address: '1 Toji-cho, Minami, Kyoto 601-8412' },
    ],
  },
  {
    aliases: ['osaka namba', '大阪なんば', 'namba', '難波', 'dotonbori', '道頓堀'],
    label: 'Osaka Namba',
    anchor: { lat: 34.6687, lng: 135.5014, label: 'Namba Station' },
    hotels: [
      { name: 'Cross Hotel Osaka', nameLocal: 'クロスホテル大阪', lat: 34.6723, lng: 135.5034, google: 4.4, reviewCount: 2341, phone: '+81-6-6213-8281', placeId: 'ChIJosaka001cross', roomTypes: ['Standard Room','Deluxe Room','Superior Room'], image: '✚', address: '2-5-15 Shinsaibashisuji, Chuo, Osaka 542-0085' },
      { name: 'Dormy Inn Namba', nameLocal: 'ドーミーイン難波', lat: 34.6678, lng: 135.5002, google: 4.5, reviewCount: 3456, phone: '+81-6-6213-9090', placeId: 'ChIJosaka002dormy', roomTypes: ['Single Room','Double Room','Triple Room'], image: '♨', address: '2-12-22 Sennichimae, Chuo, Osaka 542-0074' },
      { name: 'Swissotel Nankai Osaka', nameLocal: 'スイスホテル南海大阪', lat: 34.6690, lng: 135.5020, google: 4.6, reviewCount: 2876, phone: '+81-6-6646-5111', placeId: 'ChIJosaka003swissotel', roomTypes: ['Deluxe Room','Tower Room','Suite'], image: '🏙', address: '5-1-60 Namba, Chuo, Osaka 542-0076' },
      { name: 'Candeo Hotels Osaka Namba', nameLocal: 'カンデオホテルズ大阪なんば', lat: 34.6659, lng: 135.4989, google: 4.4, reviewCount: 1654, phone: '+81-6-6631-5757', placeId: 'ChIJosaka004candeo', roomTypes: ['Single Room','Double Room','Triple Room'], image: '🌙', address: '2-2-14 Namba, Chuo, Osaka 542-0076' },
      { name: 'Hotel Monterey Grasmere Osaka', nameLocal: 'ホテルモントレグラスミア大阪', lat: 34.6712, lng: 135.4998, google: 4.3, reviewCount: 1987, phone: '+81-6-6645-7111', placeId: 'ChIJosaka005monterey', roomTypes: ['Standard Room','Superior Room','Deluxe Room'], image: '🌿', address: '1-2-3 Minatomachi, Naniwa, Osaka 556-0017' },
    ],
  },
  {
    aliases: ['hakone', 'hakone-yumoto', '箱根', '箱根湯本', 'hakone yumoto'],
    label: 'Hakone-Yumoto',
    anchor: { lat: 35.2329, lng: 139.1067, label: 'Hakone-Yumoto Station' },
    hotels: [
      { name: 'Hakone Kowakien Tenyu', nameLocal: '箱根小涌園天悠', lat: 35.2334, lng: 139.1023, google: 4.7, reviewCount: 1234, phone: '+81-460-82-5500', placeId: 'ChIJhakone001tenyu', roomTypes: ['Japanese Room','Deluxe Japanese Room','Suite'], image: '♨', address: '1297 Ninotaira, Hakone, Ashigarashimo, Kanagawa' },
      { name: 'Fujiya Hotel', nameLocal: '富士屋ホテル', lat: 35.2312, lng: 139.0987, google: 4.6, reviewCount: 2109, phone: '+81-460-82-2211', placeId: 'ChIJhakone002fujiya', roomTypes: ['Standard Room','Superior Room','Suite'], image: '🗻', address: '359 Miyanoshita, Hakone, Kanagawa 250-0404' },
      { name: 'Ryuguden', nameLocal: '龍宮殿', lat: 35.2198, lng: 139.0845, google: 4.8, reviewCount: 876, phone: '+81-460-83-1121', placeId: 'ChIJhakone003ryuguden', roomTypes: ['Japanese Suite','Deluxe Japanese Room'], image: '🐉', address: '100 Motohakone, Hakone, Kanagawa 250-0522' },
      { name: 'Hakone Prince Hotel', nameLocal: '箱根プリンスホテル', lat: 35.2187, lng: 139.0834, google: 4.5, reviewCount: 1543, phone: '+81-460-83-1111', placeId: 'ChIJhakone004prince', roomTypes: ['Lake View Room','Mountain View Room','Family Room'], image: '👑', address: '144 Motohakone, Hakone, Kanagawa 250-0592' },
      { name: 'Yama no Chaya Hakone', nameLocal: '山のちゃや 箱根', lat: 35.2341, lng: 139.1078, google: 4.3, reviewCount: 456, phone: '+81-460-85-5441', placeId: 'ChIJhakone005yamachaya', roomTypes: ['Single Room','Double Room'], image: '🌿', address: '694 Yumoto, Hakone, Kanagawa 250-0311' },
    ],
  },
  {
    aliases: ['times square nyc', 'times square', 'new york', 'nyc', 'manhattan'],
    label: 'Times Square NYC',
    anchor: { lat: 40.7580, lng: -73.9855, label: 'Times Square' },
    hotels: [
      { name: 'The Knickerbocker Hotel', nameLocal: 'The Knickerbocker Hotel', lat: 40.7571, lng: -73.9875, google: 4.5, reviewCount: 3241, phone: '+1-212-204-4980', placeId: 'ChIJnyc001knickerbocker', roomTypes: ['Deluxe Room','Premium Room','Suite'], image: '🗽', address: '6 Times Square, New York, NY 10036' },
      { name: 'Marriott Marquis Times Square', nameLocal: 'Marriott Marquis Times Square', lat: 40.7585, lng: -73.9858, google: 4.4, reviewCount: 8765, phone: '+1-212-398-1900', placeId: 'ChIJnyc002marriott', roomTypes: ['Standard Room','Deluxe Room','Junior Suite'], image: '🌆', address: '1535 Broadway, New York, NY 10036' },
      { name: 'citizenM New York Times Square', nameLocal: 'citizenM New York Times Square', lat: 40.7561, lng: -73.9894, google: 4.6, reviewCount: 4532, phone: '+1-212-461-3638', placeId: 'ChIJnyc003citizenm', roomTypes: ['Standard Room'], image: '🏙', address: '218 W 50th St, New York, NY 10019' },
      { name: 'Row NYC Hotel', nameLocal: 'Row NYC Hotel', lat: 40.7601, lng: -73.9901, google: 4.2, reviewCount: 5678, phone: '+1-212-869-3600', placeId: 'ChIJnyc004row', roomTypes: ['Standard Room','Superior Room','Family Room'], image: '🏨', address: '700 8th Ave, New York, NY 10036' },
      { name: 'Yotel New York', nameLocal: 'Yotel New York', lat: 40.7578, lng: -73.9942, google: 4.3, reviewCount: 3109, phone: '+1-646-449-7700', placeId: 'ChIJnyc005yotel', roomTypes: ['Smart Room','Premium Smart Room','2-Cabin'], image: '🚀', address: '570 10th Ave, New York, NY 10036' },
    ],
  },
  {
    aliases: ['eiffel tower', 'eiffel', 'paris', 'trocadéro', 'trocadero', 'tour eiffel'],
    label: 'Eiffel Tower Paris',
    anchor: { lat: 48.8584, lng: 2.2945, label: 'Eiffel Tower' },
    hotels: [
      { name: 'Shangri-La Paris', nameLocal: 'Shangri-La Paris', lat: 48.8624, lng: 2.2978, google: 4.8, reviewCount: 2341, phone: '+33-1-53-67-19-98', placeId: 'ChIJparis001shangri', roomTypes: ['Deluxe Room','Grand Deluxe','Suite'], image: '🗼', address: '10 Avenue d\'Iéna, 75116 Paris' },
      { name: 'Pullman Paris Tour Eiffel', nameLocal: 'Pullman Paris Tour Eiffel', lat: 48.8567, lng: 2.2903, google: 4.5, reviewCount: 3456, phone: '+33-1-44-38-56-00', placeId: 'ChIJparis002pullman', roomTypes: ['Classic Room','Superior Room','Suite'], image: '✨', address: '18 Avenue de Suffren, 75015 Paris' },
      { name: 'Hôtel Trocadéro La Tour', nameLocal: 'Hôtel Trocadéro La Tour', lat: 48.8634, lng: 2.2901, google: 4.3, reviewCount: 987, phone: '+33-1-45-24-43-03', placeId: 'ChIJparis003trocadero', roomTypes: ['Standard Room','Superior Room'], image: '🏰', address: '5 Rue Massenet, 75116 Paris' },
      { name: 'Le Cinq Codet', nameLocal: 'Le Cinq Codet', lat: 48.8543, lng: 2.3012, google: 4.7, reviewCount: 876, phone: '+33-1-53-85-15-60', placeId: 'ChIJparis004cinqcodet', roomTypes: ['Classic Room','Deluxe Room','Suite'], image: '🌹', address: '5 Rue Louis Codet, 75007 Paris' },
      { name: 'ibis Paris Tour Eiffel Cambronne', nameLocal: 'ibis Paris Tour Eiffel', lat: 48.8512, lng: 2.2998, google: 4.1, reviewCount: 4321, phone: '+33-1-40-65-95-00', placeId: 'ChIJparis005ibis', roomTypes: ['Standard Room','Triple Room'], image: '🏨', address: '2 Rue Cambronne, 75015 Paris' },
    ],
  },
  {
    aliases: ['taipei 101', 'taipei101', '台北101', 'xinyi', '信義', 'taipei'],
    label: 'Taipei 101',
    anchor: { lat: 25.0330, lng: 121.5654, label: 'Taipei 101' },
    hotels: [
      { name: 'W Taipei', nameLocal: 'W 台北', lat: 25.0412, lng: 121.5645, google: 4.6, reviewCount: 3241, phone: '+886-2-7703-8888', placeId: 'ChIJtaipei001w', roomTypes: ['Wonderful Room','Spectacular Room','Suite'], image: '🌟', address: '10 Zhongxiao East Road Sec 5, Xinyi, Taipei 110' },
      { name: 'Grand Hyatt Taipei', nameLocal: '台北君悦酒店', lat: 25.0389, lng: 121.5631, google: 4.7, reviewCount: 4532, phone: '+886-2-2720-1234', placeId: 'ChIJtaipei002grandhyatt', roomTypes: ['Deluxe Room','Grand Room','Suite'], image: '👑', address: '2 Songshou Road, Xinyi, Taipei 110' },
      { name: 'Taipei Marriott Hotel', nameLocal: '台北萬豪酒店', lat: 25.0832, lng: 121.5629, google: 4.5, reviewCount: 2109, phone: '+886-2-8502-6789', placeId: 'ChIJtaipei003marriott', roomTypes: ['Standard Room','Deluxe Room','Suite'], image: '🏙', address: '199 Lequn 2nd Road, Zhongshan, Taipei 104' },
      { name: 'FX Hotel Tianmu', nameLocal: '天母富信大飯店', lat: 25.0889, lng: 121.5278, google: 4.4, reviewCount: 1654, phone: '+886-2-2871-8899', placeId: 'ChIJtaipei004fx', roomTypes: ['Standard Room','Superior Room','Family Room'], image: '🏨', address: '128 Zhongshan N. Rd. Sec 7, Shilin, Taipei 111' },
      { name: 'Just Sleep Ximending', nameLocal: '捷絲旅 西門町館', lat: 25.0434, lng: 121.5019, google: 4.5, reviewCount: 3456, phone: '+886-2-7728-1818', placeId: 'ChIJtaipei005justsleep', roomTypes: ['Single Room','Double Room','4-Person Room'], image: '💤', address: '77 Wuning Street, Wanhua, Taipei 108' },
      { name: 'Amba Taipei Zhongshan', nameLocal: '台北中山 意舍酒店', lat: 25.0497, lng: 121.5234, google: 4.6, reviewCount: 1987, phone: '+886-2-2181-9999', placeId: 'ChIJtaipei006amba', roomTypes: ['Cozy Room','Cool Room','Suite'], image: '🎨', address: '57-1 Shuanglian Street, Zhongshan, Taipei 104' },
    ],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nightsBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function datedAvailability(hotel, checkIn, checkOut, searchTick) {
  const seed = `${hotel.placeId}|${checkIn}|${checkOut}|${searchTick}`;
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0; // FNV prime, unsigned
  }
  const v = hash % 100;
  let threshold = 40; // ~40% fully booked
  if (hotel.google >= 4.6 && hotel.reviewCount > 200) threshold = 55; // popular = more often booked
  return v >= threshold;
}

function resolveDataset(landmark) {
  const q = landmark.trim().toLowerCase();
  return DEMO_DATASET.find(d =>
    d.aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))
  ) || null;
}

function formatDate(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00');
  if (locale === 'zh-TW') {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  if (locale === 'ja') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Live Search ──────────────────────────────────────────────────────────────
async function liveSearchHotels(landmark, radiusKm) {
  const searchRes = await fetch(
    `${API_BASE}/api/places/search?query=${encodeURIComponent(landmark + ' hotel')}&language=en`
  );
  if (!searchRes.ok) throw new Error('Landmark not found');
  const searchData = await searchRes.json();
  if (!searchData.results?.length) throw new Error('No matching landmark found on Google Maps');

  const { lat, lng } = searchData.results[0].geometry.location;
  const radiusM = radiusKm * 1000;

  const delay = ms => new Promise(r => setTimeout(r, ms));

  async function fetchKeyword(keyword) {
    const hotels = [];
    let pageToken = '';
    for (let page = 0; page < 3; page++) {
      const params = new URLSearchParams({
        lat, lng, radius: radiusM, type: 'lodging', keyword, language: 'en',
        ...(pageToken ? { pageToken } : {}),
      });
      const r = await fetch(`${API_BASE}/api/places/nearby?${params}`);
      if (!r.ok) break;
      const data = await r.json();
      if (data.results) {
        hotels.push(...data.results);
      }
      if (data.next_page_token) {
        pageToken = data.next_page_token;
        await delay(2100);
      } else {
        break;
      }
    }
    return hotels;
  }

  const results = await Promise.all(HOTEL_KEYWORDS.map(fetchKeyword));
  const seen = new Set();
  const unique = [];
  for (const hotel of results.flat()) {
    if (!seen.has(hotel.place_id)) {
      seen.add(hotel.place_id);
      unique.push({
        name: hotel.name,
        nameLocal: hotel.name,
        lat: hotel.geometry.location.lat,
        lng: hotel.geometry.location.lng,
        google: hotel.rating || 0,
        reviewCount: hotel.user_ratings_total || 0,
        phone: null,
        placeId: hotel.place_id,
        roomTypes: ['Standard Room', 'Deluxe Room', 'Family Room'],
        available: true,
        image: '🏨',
        address: hotel.vicinity || hotel.formatted_address || '',
      });
    }
  }
  return { hotels: unique, anchor: { lat, lng } };
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function buildEmailContent(hotel, lang, { landmark, checkIn, checkOut, adults, children, rooms }) {
  const nights = nightsBetween(checkIn, checkOut);
  const roomBreakdown = rooms
    .filter(r => r.qty > 0)
    .map(r => `${r.label} × ${r.qty}`)
    .join(', ');
  const totalRooms = rooms.reduce((s, r) => s + r.qty, 0);

  if (lang === 'zh-TW') {
    const ci = formatDate(checkIn, 'zh-TW');
    const co = formatDate(checkOut, 'zh-TW');
    const subject = `預訂諮詢：${hotel.name}（${ci}–${co}，共${nights}晚）`;
    const body = `${hotel.name} 敬啟

您好，

本人擬於 ${ci} 至 ${co}（共 ${nights} 晚）前往 ${landmark} 旅遊，希望洽詢貴飯店住宿事宜。

住宿資訊如下：
・入住日期：${ci}
・退房日期：${co}
・住宿晚數：${nights} 晚
・旅客人數：大人 ${adults} 位${children > 0 ? `、兒童 ${children} 位` : ''}
・房間數量：${totalRooms} 間（${roomBreakdown}）

敬請確認上述日期是否仍有空房，並告知相關費用與訂房方式。

感謝您的協助，順頌時祺。

[您的姓名]`;
    return { subject, body };
  }

  if (lang === 'ja') {
    const ci = formatDate(checkIn, 'ja');
    const co = formatDate(checkOut, 'ja');
    const subject = `宿泊予約のお問い合わせ：${hotel.name}（${ci}〜${co} ${nights}泊）`;
    const body = `${hotel.name} ご担当者様

お世話になっております。

${ci}より${co}まで、${nights}泊にて${landmark}への旅行を予定しており、貴ホテルへの宿泊をご検討しております。

■ 宿泊詳細
・チェックイン：${ci}
・チェックアウト：${co}
・宿泊数：${nights}泊
・ご利用人数：大人${adults}名${children > 0 ? `、お子様${children}名` : ''}
・お部屋数：${totalRooms}室（${roomBreakdown}）

上記の日程でお部屋の空き状況と料金をご確認いただけますでしょうか。

ご確認のほど、何卒よろしくお願い申し上げます。

[お名前]`;
    return { subject, body };
  }

  // English
  const ci = formatDate(checkIn, 'en');
  const co = formatDate(checkOut, 'en');
  const subject = `Booking Inquiry – ${hotel.name} (${ci}–${co}, ${nights} nights)`;
  const body = `Dear ${hotel.name} Team,

I am planning a trip to ${landmark} and would like to inquire about room availability at your property.

Stay Details:
- Check-in: ${formatDate(checkIn, 'en')} (${checkIn})
- Check-out: ${formatDate(checkOut, 'en')} (${checkOut})
- Duration: ${nights} night${nights > 1 ? 's' : ''}
- Guests: ${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}
- Rooms: ${totalRooms} room${totalRooms > 1 ? 's' : ''} (${roomBreakdown})

Could you please confirm availability for the above dates and provide pricing information?

Thank you for your assistance.

Best regards,
[Your Name]`;
  return { subject, body };
}

// ─── Snowflakes Component ─────────────────────────────────────────────────────
function Snowflakes() {
  const flakes = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${(i * 5.5 + 2) % 100}%`,
      animDuration: `${8 + (i % 7) * 2}s`,
      animDelay: `${(i * 1.1) % 8}s`,
      fontSize: `${0.7 + (i % 4) * 0.2}em`,
      char: SNOWFLAKES[i % 3],
      opacity: 0.15 + (i % 4) * 0.07,
    })), []);
  return (
    <>
      {flakes.map(f => (
        <span
          key={f.id}
          className="snowflake"
          style={{
            left: f.left,
            animationDuration: f.animDuration,
            animationDelay: f.animDelay,
            fontSize: f.fontSize,
            opacity: f.opacity,
          }}
        >
          {f.char}
        </span>
      ))}
    </>
  );
}

// ─── Stepper Input ────────────────────────────────────────────────────────────
function Stepper({ value, onChange, min = 0, max = 20 }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold"
      >−</button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        onFocus={e => e.target.select()}
        className="w-10 text-center border border-stone-300 rounded py-0.5 text-sm text-stone-800 bg-white"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold"
      >+</button>
    </div>
  );
}

// ─── Inquiry Modal ────────────────────────────────────────────────────────────
function InquiryModal({ hotel, booking, onClose }) {
  const [lang, setLang] = useState('zh-TW');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [details, setDetails] = useState(null);
  const [detailsTried, setDetailsTried] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSearching, setEmailSearching] = useState(false);
  const [suggestedEmails, setSuggestedEmails] = useState([]);
  const [emailSource, setEmailSource] = useState(null); // 'website' | 'search' | null
  const [bookingPageUrl, setBookingPageUrl] = useState(null);

  useEffect(() => {
    if (!hotel.placeId) { setDetailsTried(true); return; }
    fetch(`${API_BASE}/api/places/details?placeId=${hotel.placeId}&language=en`)
      .then(r => r.json())
      .then(d => { if (d.result) setDetails(d.result); })
      .catch(() => {})
      .finally(() => setDetailsTried(true));
  }, [hotel.placeId]);

  // Find the hotel's email once the details fetch has settled. Primary path is
  // scraping the official website (free); if there's no website or no email is
  // found, fall back to a Claude web search using the hotel name + address.
  useEffect(() => {
    if (!detailsTried) return;
    let cancelled = false;

    async function lookup() {
      setEmailSearching(true);
      try {
        // 1) Scrape the official website, if Google Places gave us one
        const website = details?.website;
        if (website) {
          const d = await fetch(`${API_BASE}/api/hotel/website-info?url=${encodeURIComponent(website)}`)
            .then(r => r.json()).catch(() => ({}));
          if (cancelled) return;
          if (d.bookingUrl) setBookingPageUrl(d.bookingUrl);
          if (d.emails?.length) {
            setSuggestedEmails(d.emails);
            setRecipientEmail(prev => prev || d.emails[0]);
            setEmailSource('website');
            return;
          }
        }
        // 2) Fallback: ask Claude to web-search for the official email
        const params = new URLSearchParams({ name: hotel.name, address: hotel.address || '' });
        const f = await fetch(`${API_BASE}/api/hotel/find-email?${params}`)
          .then(r => r.json()).catch(() => ({}));
        if (cancelled) return;
        if (f.email) {
          setSuggestedEmails(prev => (prev.length ? prev : [f.email]));
          setRecipientEmail(prev => prev || f.email);
          setEmailSource('search');
        }
      } finally {
        if (!cancelled) setEmailSearching(false);
      }
    }

    lookup();
    return () => { cancelled = true; };
  }, [detailsTried]);

  const phone = details?.formatted_phone_number || details?.international_phone_number || hotel.phone;
  const website = details?.website;
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${hotel.placeId}`;

  const { subject, body } = buildEmailContent(hotel, lang, booking);

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4 relative" style={{ fontFamily: 'Inter, sans-serif' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
          <X size={20} />
        </button>

        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-900" style={{ fontFamily: 'Fraunces, serif' }}>
            {hotel.available ? 'Email Inquiry' : 'Inquire via Email'}
          </h2>
          <p className="text-stone-600 mt-1 text-sm">{hotel.name}</p>
          {hotel.nameLocal && hotel.nameLocal !== hotel.name && (
            <p className="text-stone-400 text-xs">{hotel.nameLocal}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1 text-emerald-700 hover:underline">
                <Phone size={13} />{phone}
              </a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                <Globe size={13} />官方網站
              </a>
            )}
            {(bookingPageUrl || website) && (
              <a href={bookingPageUrl || website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">
                <ExternalLink size={11} />官網訂房
              </a>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-stone-500 hover:underline">
              <MapPin size={13} />Google Maps
            </a>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-stone-500">收件者 Email</label>
              {emailSearching && (
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-stone-300 border-t-emerald-500 rounded-full animate-spin inline-block" />
                  搜尋官網 email…
                </span>
              )}
              {!emailSearching && emailSource === 'website' && (
                <span className="text-xs text-emerald-600">✓ 從官網自動偵測</span>
              )}
              {!emailSearching && emailSource === 'search' && (
                <span className="text-xs text-emerald-600">✓ 透過網路搜尋找到</span>
              )}
              {!emailSearching && detailsTried && !emailSource && !recipientEmail && (
                <span className="text-xs text-amber-600">查無 email，請手動輸入</span>
              )}
            </div>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="自動搜尋中，或手動貼上飯店 email"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {suggestedEmails.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {suggestedEmails.map(e => (
                  <button key={e} type="button" onClick={() => setRecipientEmail(e)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${recipientEmail === e ? 'bg-emerald-600 text-white border-emerald-600' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Language</label>
            <div className="flex rounded-lg border border-stone-300 overflow-hidden text-sm">
              {[['zh-TW', '繁體中文'], ['en', 'English'], ['ja', '日本語']].map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`flex-1 py-1.5 font-medium transition-colors ${lang === code ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Subject</label>
            <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700">{subject}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Body</label>
            <textarea
              readOnly
              value={body}
              rows={9}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 resize-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
            >
              <Copy size={14} />{copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={mailtoUrl}
              className="flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
            >
              <Mail size={14} />Default Mail
            </a>
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-700"
            >
              <ExternalLink size={14} />Send via Gmail
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Link Preview ────────────────────────────────────────────────────────────
const SITE_META = {
  maps: {
    label: 'Google Maps',
    icon: 'https://www.google.com/favicon.ico',
    color: '#4285F4',
    desc: 'View location on Google Maps',
  },
  booking: {
    label: 'Booking.com',
    icon: 'https://www.booking.com/favicon.ico',
    color: '#003580',
    desc: 'Check availability & book on Booking.com',
  },
  agoda: {
    label: 'Agoda',
    icon: 'https://www.agoda.com/favicon.ico',
    color: '#E11D48',
    desc: 'Search & compare prices on Agoda',
  },
};

function LinkPreview({ type, href, hotelName, price, currency, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const meta = SITE_META[type];

  function handleMouseEnter(e) {
    setPos({ x: e.clientX, y: e.clientY });
    setShow(true);
  }
  function handleMouseMove(e) {
    setPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <span className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShow(false)}
    >
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-xs px-2 py-1 border border-stone-200 rounded-md text-stone-500 hover:bg-stone-50 flex items-center gap-1">
        {children}
      </a>
      {show && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: pos.x + 14, top: pos.y - 10 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 p-3 w-56 text-left">
            <div className="flex items-center gap-2 mb-2">
              <img src={meta.icon} alt="" className="w-4 h-4 rounded" onError={e => e.target.style.display='none'} />
              <span className="font-semibold text-xs" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <p className="text-stone-800 text-xs font-medium leading-tight mb-1 line-clamp-2">{hotelName}</p>
            {price && (
              <p className="text-emerald-700 text-xs font-bold mb-1">NT${price.toLocaleString()}/晚</p>
            )}
            <p className="text-stone-400 text-xs">{meta.desc}</p>
          </div>
        </div>
      )}
    </span>
  );
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────
function HotelCard({ hotel, distanceM, onEmail, checkIn, checkOut, adults }) {
  const dist = distanceM < 1000
    ? `${Math.round(distanceM)} m`
    : `${(distanceM / 1000).toFixed(1)} km`;

  // place_id is the most reliable Maps link — works regardless of hotel name language
  const mapsUrl = hotel.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${hotel.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name)}`;

  const linkName = hotel.bookingHotelName || hotel.name;
  const bookingUrl = hotel.bookingDirectUrl
    || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(linkName)}&dest_type=property&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1&selected_currency=TWD`;
  const agodaUrl = `https://www.agoda.com/search?q=${encodeURIComponent(linkName)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rooms=1`;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4 hover:shadow-md transition-shadow">
      <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center bg-stone-50 rounded-xl">
        {hotel.image}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm leading-tight" style={{ fontFamily: 'Fraunces, serif' }}>
              {hotel.name}
            </h3>
            {hotel.nameLocal && hotel.nameLocal !== hotel.name && (
              <p className="text-stone-400 text-xs">{hotel.nameLocal}</p>
            )}
            {hotel.bookingHotelName && hotel.bookingHotelName !== hotel.name && (
              <p className="text-stone-400 text-xs">Booking: {hotel.bookingHotelName}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hotel.pricePerNight && (
              <span className="text-xs font-bold text-emerald-700">
                NT${hotel.pricePerNight.toLocaleString()}<span className="font-normal text-stone-400">/晚</span>
              </span>
            )}
            {hotel.isRealData ? (
              hotel.available ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">Available ✓</span>
              ) : (
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 whitespace-nowrap">
                  Check Availability
                </a>
              )
            ) : (
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap">
                Check Availability
              </a>
            )}
          </div>
        </div>

        {hotel.address && (
          <p className="text-stone-400 text-xs mt-1 flex items-center gap-1 truncate">
            <MapPin size={11} />{hotel.address}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {hotel.google > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-stone-600">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              {hotel.google.toFixed(1)}
              {hotel.reviewCount > 0 && <span className="text-stone-400 ml-0.5">({hotel.reviewCount.toLocaleString()})</span>}
            </span>
          )}
          <span className="text-xs text-stone-400 flex items-center gap-0.5">
            <MapPin size={11} />{dist}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <LinkPreview type="maps" href={mapsUrl} hotelName={hotel.name} price={hotel.pricePerNight} currency={hotel.currency}>
            <MapPin size={11} />Maps
          </LinkPreview>
          <LinkPreview type="booking" href={bookingUrl} hotelName={hotel.name} price={hotel.pricePerNight} currency={hotel.currency}>
            <Hotel size={11} />Booking.com
          </LinkPreview>
          <LinkPreview type="agoda" href={agodaUrl} hotelName={hotel.name} price={hotel.pricePerNight} currency={hotel.currency}>
            <Globe size={11} />Agoda
          </LinkPreview>
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="text-xs px-2 py-1 border border-stone-200 rounded-md text-stone-500 hover:bg-stone-50 flex items-center gap-1">
              <Phone size={11} />Call
            </a>
          )}
          <button
            onClick={onEmail}
            className="ml-auto text-xs px-3 py-1 rounded-md font-medium flex items-center gap-1 bg-stone-800 text-white hover:bg-stone-600"
          >
            <Mail size={11} />Email
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Name normalization for fuzzy matching ────────────────────────────────────
function normName(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function wordsOf(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}
function nameScore(a, b) {
  const na = normName(a), nb = normName(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wa = new Set(wordsOf(a)), wb = wordsOf(b);
  const shared = wb.filter(w => wa.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return shared / union; // Jaccard
}

// ─── Hybrid Search (Google Places ALL hotels + Booking.com availability) ──────
async function bookingLiveSearch(landmark, checkin, checkout, adults, children, rooms, radiusKm) {
  // Step 1: resolve landmark to exact coords via Google Places
  let anchorCoords = null;
  let englishName = landmark;
  try {
    const placesRes = await fetch(`${API_BASE}/api/places/search?query=${encodeURIComponent(landmark)}&language=en`);
    if (placesRes.ok) {
      const placesData = await placesRes.json();
      const place = placesData.results?.[0];
      if (place) {
        anchorCoords = place.geometry?.location;
        englishName = place.name;
      }
    }
  } catch { /* ignore */ }

  if (!anchorCoords) throw new Error('Could not resolve landmark location');

  const radiusM = radiusKm * 1000;

  // Step 2: Google Places nearbysearch — ALL hotels regardless of availability
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const seen = new Set();
  const allHotels = [];

  for (const keyword of HOTEL_KEYWORDS) {
    let pageToken = '';
    for (let page = 0; page < 3; page++) {
      const params = new URLSearchParams({
        lat: anchorCoords.lat, lng: anchorCoords.lng,
        radius: radiusM, type: 'lodging', keyword, language: 'zh-TW',
        ...(pageToken ? { pageToken } : {}),
      });
      const r = await fetch(`${API_BASE}/api/places/nearby?${params}`);
      if (!r.ok) break;
      const data = await r.json();
      (data.results || []).forEach(h => {
        if (!seen.has(h.place_id)) {
          seen.add(h.place_id);
          allHotels.push(h);
        }
      });
      if (data.next_page_token) { pageToken = data.next_page_token; await delay(2100); }
      else break;
    }
  }

  // Step 3: Booking.com — available hotels with real prices
  let availableMap = new Map();
  try {
    const destRes = await fetch(`${API_BASE}/api/booking/destination?query=${encodeURIComponent(englishName)}`);
    if (destRes.ok) {
      const destData = await destRes.json();
      // Detect quota-exceeded error from RapidAPI
      if (destData.message && destData.message.toLowerCase().includes('quota')) {
        throw Object.assign(new Error(destData.message), { code: 'QUOTA_EXCEEDED' });
      }
      const dest = destData.data?.[0];
      if (dest) {
        const bParams = new URLSearchParams({
          dest_id: dest.dest_id, search_type: dest.search_type,
          checkin_date: checkin, checkout_date: checkout,
          adults_number: adults, children_number: children,
          room_number: rooms, currency_code: 'TWD',
        });
        const bRes = await fetch(`${API_BASE}/api/booking/search?${bParams}`);
        if (bRes.ok) {
          const bData = await bRes.json();
          (bData.data?.hotels || []).forEach(h => {
            const price = h.property.priceBreakdown?.grossPrice;
            const name = h.property.name || '';
            // dest_type=property targets a specific accommodation, not a city/region
            const directUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name)}&dest_type=property&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=1&selected_currency=TWD`;
            availableMap.set(name, {
              pricePerNight: price ? Math.round(price.value) : null,
              currency: price?.currency || 'TWD',
              lat: h.property.latitude ?? null,
              lng: h.property.longitude ?? null,
              bookingHotelName: h.property.name,
              bookingDirectUrl: directUrl,
            });
          });
        }
      }
    }
  } catch { /* Booking.com optional — still show all Google results */ }

  const bookingEntries = Array.from(availableMap.entries()); // [bName, info]
  console.log('[hybrid] Booking.com available hotels:', bookingEntries.map(([n, i]) => `${n} (${i.lat},${i.lng})`));

  // Haversine distance in metres
  function haversineM(lat1, lng1, lat2, lng2) {
    const R = 6371000, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Step 4: merge — coordinates first (≤300 m), then name fallback (score ≥ 0.7)
  const merged = allHotels.map(h => {
    const hLat = h.geometry.location.lat, hLng = h.geometry.location.lng;
    let bookingInfo = null;
    let matchLabel = '';

    // 4a: coordinate match
    let bestDist = Infinity;
    for (const [bName, bInfo] of bookingEntries) {
      if (bInfo.lat != null && bInfo.lng != null) {
        const d = haversineM(hLat, hLng, bInfo.lat, bInfo.lng);
        if (d < bestDist && d <= 100) { bestDist = d; bookingInfo = bInfo; matchLabel = `coord ${Math.round(d)}m`; }
      }
    }

    // 4b: name fallback (only when no coord data available from Booking.com)
    if (!bookingInfo) {
      const hasCoords = bookingEntries.some(([, i]) => i.lat != null);
      if (!hasCoords) {
        let bestScore = 0;
        for (const [bName, bInfo] of bookingEntries) {
          const score = nameScore(h.name, bName);
          if (score > bestScore && score >= 0.7) { bestScore = score; bookingInfo = bInfo; matchLabel = `name ${bestScore.toFixed(2)}`; }
        }
      }
    }

    if (bookingInfo) console.log(`[hybrid] matched "${h.name}" via ${matchLabel}`);
    return {
      name: h.name,
      nameLocal: h.name,
      lat: h.geometry.location.lat,
      lng: h.geometry.location.lng,
      google: h.rating || 0,
      reviewCount: h.user_ratings_total || 0,
      phone: null,
      placeId: h.place_id,
      roomTypes: ['Standard Room', 'Deluxe Room', 'Family Room'],
      available: !!bookingInfo,
      image: '🏨',
      address: h.vicinity || '',
      pricePerNight: bookingInfo?.pricePerNight || null,
      currency: bookingInfo?.currency || 'TWD',
      bookingDirectUrl: bookingInfo?.bookingDirectUrl || null,
      bookingHotelName: bookingInfo?.bookingHotelName || null,
      isRealData: true,
    };
  });

  return { hotels: merged, anchor: anchorCoords };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);

  // Mode
  const [apiMode, setApiMode] = useState('demo');
  const [hasRapidApiKey, setHasRapidApiKey] = useState(false);
  const [rapidApiQuotaExceeded, setRapidApiQuotaExceeded] = useState(false);

  // Form state (live)
  const [landmark, setLandmark] = useState('');
  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfterTomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomQtys, setRoomQtys] = useState({ single: 0, double: 1, triple: 0, quad: 0, family: 0 });
  const [radiusKm, setRadiusKm] = useState(2);

  // Search state
  const [searchTick, setSearchTick] = useState(0);
  const [committedQuery, setCommittedQuery] = useState(null);

  // Results
  const [hotels, setHotels] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unknownLandmark, setUnknownLandmark] = useState(false);

  // Sort / display / filter
  const [sortBy, setSortBy] = useState('smart');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal
  const [modalHotel, setModalHotel] = useState(null);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef(null);

  // ── Mode detection ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => {
        setApiMode(d.hasKey ? 'live' : 'no-key');
        setHasRapidApiKey(!!d.hasRapidApiKey);
      })
      .catch(() => setApiMode('demo'));
  }, []);

  // ── Bump stale dates ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = todayStr();
    if (checkIn < t) setCheckIn(addDays(t, 1));
    if (checkOut <= checkIn) setCheckOut(addDays(checkIn, 1));
  }, []);

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    setDisplayCount(10);
  }, [committedQuery, sortBy, showAvailableOnly]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setDisplayCount(n => n + 10);
          setLoadingMore(false);
        }, 250);
      }
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadingMore, hotels.length]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleCheckInChange(val) {
    const t = todayStr();
    const clamped = val < t ? t : val;
    setCheckIn(clamped);
    if (checkOut <= clamped) setCheckOut(addDays(clamped, 1));
  }

  function handleRoomQty(id, val) {
    setRoomQtys(prev => ({ ...prev, [id]: Math.min(9, Math.max(0, val)) }));
  }

  const totalRooms = Object.values(roomQtys).reduce((a, b) => a + b, 0);
  const totalCapacity = ROOM_TYPE_CATALOG.reduce((s, t) => s + t.capacity * (roomQtys[t.id] || 0), 0);
  const roomChips = ROOM_TYPE_CATALOG.filter(t => roomQtys[t.id] > 0)
    .map(t => `${t.label} × ${roomQtys[t.id]}`);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!landmark.trim()) return;

    const tick = searchTick + 1;
    setSearchTick(tick);
    setError('');
    setUnknownLandmark(false);

    const query = { landmark: landmark.trim(), checkIn, checkOut, adults, children, radiusKm, searchTick: tick };
    setCommittedQuery(query);
    setLoading(true);
    setHotels([]);

    try {
      if (hasRapidApiKey && !rapidApiQuotaExceeded) {
        try {
          const { hotels: bookingHotels, anchor: bookingAnchor } = await bookingLiveSearch(
            landmark.trim(), checkIn, checkOut, adults, children, Math.max(1, totalRooms), radiusKm
          );
          setHotels(bookingHotels);
          setAnchor(bookingAnchor);
        } catch (bookingErr) {
          if (bookingErr.code === 'QUOTA_EXCEEDED') {
            setRapidApiQuotaExceeded(true);
            // fall through to Google Places below
            const { hotels: liveHotels, anchor: liveAnchor } = await liveSearchHotels(landmark.trim(), radiusKm);
            setHotels(liveHotels);
            setAnchor(liveAnchor);
          } else {
            throw bookingErr;
          }
        }
      } else if (apiMode === 'live') {
        const { hotels: liveHotels, anchor: liveAnchor } = await liveSearchHotels(landmark.trim(), radiusKm);
        setHotels(liveHotels);
        setAnchor(liveAnchor);
      } else {
        const dataset = resolveDataset(landmark.trim());
        if (!dataset) {
          setUnknownLandmark(true);
          setLoading(false);
          return;
        }
        setHotels(dataset.hotels);
        setAnchor(dataset.anchor);
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Sorted + filtered hotels ────────────────────────────────────────────────
  const processedHotels = useMemo(() => {
    if (!hotels.length || !anchor) return { within: [], beyond: [] };

    const withDist = hotels.map(h => ({
      ...h,
      distanceM: calcDistance(anchor.lat, anchor.lng, h.lat, h.lng),
    }));

    const maxRating = Math.max(...withDist.map(h => h.google), 0) || 5;
    const maxDist = Math.max(...withDist.map(h => h.distanceM), 1);

    function score(h) {
      if (sortBy === 'rating') return h.google;
      if (sortBy === 'distance') return -h.distanceM;
      return 0.6 * (h.google / maxRating) + 0.4 * (1 - h.distanceM / maxDist);
    }

    const sorted = [...withDist].sort((a, b) => {
      const sd = score(b) - score(a);
      if (Math.abs(sd) > 0.0001) return sd;
      return a.distanceM - b.distanceM;
    });

    const thresholdM = (committedQuery?.radiusKm ?? radiusKm) * 1000;
    const filtered = showAvailableOnly ? sorted.filter(h => h.available) : sorted;
    return {
      within: filtered.filter(h => h.distanceM <= thresholdM),
      beyond: filtered.filter(h => h.distanceM > thresholdM),
    };
  }, [hotels, anchor, sortBy, committedQuery, showAvailableOnly]);

  const allSorted = [...processedHotels.within, ...processedHotels.beyond];
  const displayed = allSorted.slice(0, displayCount);
  const hasMore = displayCount < allSorted.length;

  // ── Booking context for modal ───────────────────────────────────────────────
  const bookingCtx = {
    landmark: committedQuery?.landmark || landmark,
    checkIn: committedQuery?.checkIn || checkIn,
    checkOut: committedQuery?.checkOut || checkOut,
    adults,
    children,
    rooms: ROOM_TYPE_CATALOG.map(t => ({ ...t, qty: roomQtys[t.id] || 0 })),
  };

  // ── Banner ──────────────────────────────────────────────────────────────────
  const bannerConfig = rapidApiQuotaExceeded
    ? { bg: 'bg-red-50 border-red-200 text-red-800', text: 'RapidAPI 月配額已用完 — 已切換為 Google Places 模式，Booking.com 即時房價暫停。請至 rapidapi.com 升級方案。' }
    : hasRapidApiKey
    ? { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: 'Live mode — Booking.com 即時房價與空房 ✓' }
    : {
        live: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: 'Live mode — Google Places API connected' },
        'no-key': { bg: 'bg-amber-50 border-amber-200 text-amber-800', text: 'No API key configured — showing demo data. Add GOOGLE_PLACES_API_KEY or RAPIDAPI_KEY to backend/.env to enable live search.' },
        demo: { bg: 'bg-stone-100 border-stone-300 text-stone-600', text: 'Demo mode — backend not reachable. Showing embedded demo data.' },
      }[apiMode];

  return (
    <div className="min-h-screen relative" style={{ background: '#fafaf7', fontFamily: 'Inter, sans-serif', color: '#1c1917' }}>
      <Snowflakes />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Fraunces, serif', color: '#1c1917' }}>
            Hotel Finder
          </h1>
          <p className="text-stone-500 mt-1 text-sm">Search hotels near any landmark worldwide</p>
        </div>

        {/* Mode Banner */}
        <div className={`mb-5 rounded-xl border px-4 py-2.5 text-sm ${bannerConfig.bg}`}>
          {bannerConfig.text}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4 mb-6">
          {/* Landmark */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Landmark / Destination</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Hakuba, Tokyo Station, Eiffel Tower"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                <Calendar size={11} />Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={e => handleCheckInChange(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                <Calendar size={11} />Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                min={addDays(checkIn, 1)}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Guests */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                <Users size={11} />Adults
              </label>
              <Stepper value={adults} onChange={setAdults} min={1} max={20} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                <Users size={11} />Children
              </label>
              <Stepper value={children} onChange={setChildren} min={0} max={20} />
            </div>
          </div>

          {/* Rooms */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-2 flex items-center gap-1">
              <Layers size={11} />Room Types
            </label>
            <div className="space-y-2">
              {ROOM_TYPE_CATALOG.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">{t.label} <span className="text-stone-400 text-xs">({t.labelLocal}, sleeps {t.capacity})</span></span>
                  <Stepper value={roomQtys[t.id] || 0} onChange={v => handleRoomQty(t.id, v)} min={0} max={9} />
                </div>
              ))}
            </div>
            {totalRooms > 0 && (
              <div className="mt-2 text-xs text-stone-500">
                {totalRooms} room{totalRooms > 1 ? 's' : ''} · sleeps {totalCapacity}
                {roomChips.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roomChips.map(c => (
                      <span key={c} className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Radius */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Search Radius: {radiusKm} km
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={radiusKm}
              onChange={e => setRadiusKm(Number(e.target.value))}
              className="w-full accent-stone-800"
            />
            <div className="flex justify-between text-xs text-stone-400 mt-0.5">
              <span>1 km</span><span>10 km</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !landmark.trim()}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Search size={16} />
            {loading ? 'Searching…' : 'Search Hotels'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        {/* Unknown landmark in demo mode */}
        {unknownLandmark && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-4">
            <p className="text-sm text-stone-600 mb-3">
              <strong>"{landmark}"</strong> not found in demo dataset.
              {apiMode !== 'live' && ' In production, this would call Google Places API live.'}
            </p>
            <p className="text-xs text-stone-400 mb-3">Try one of these demo landmarks:</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_DATASET.map(d => (
                <button
                  key={d.label}
                  onClick={() => { setLandmark(d.label); }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-sm text-stone-700"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {hotels.length > 0 && committedQuery && (
          <>
            {/* Sort controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-stone-500">{allSorted.length} hotel{allSorted.length !== 1 ? 's' : ''} found</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowAvailableOnly(v => !v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${showAvailableOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}
                >
                  {showAvailableOnly ? '✓ Available Only' : 'All Hotels'}
                </button>
              <div className="flex rounded-lg border border-stone-300 overflow-hidden text-xs">
                {[['smart','Smart'],['rating','Rating'],['distance','Distance']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSortBy(val)}
                    className={`px-3 py-1.5 font-medium transition-colors ${sortBy === val ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Within radius section */}
              {processedHotels.within.length > 0 && (
                <>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                    Within {committedQuery.radiusKm} km · {processedHotels.within.length} hotels
                  </p>
                  {displayed
                    .filter(h => h.distanceM <= committedQuery.radiusKm * 1000)
                    .map(h => (
                      <HotelCard
                        key={h.placeId}
                        hotel={h}
                        distanceM={h.distanceM}
                        onEmail={() => setModalHotel(h)}
                        checkIn={committedQuery.checkIn}
                        checkOut={committedQuery.checkOut}
                        adults={committedQuery.adults}
                      />
                    ))}
                </>
              )}

              {/* Beyond radius section */}
              {processedHotels.beyond.length > 0 && displayed.some(h => h.distanceM > committedQuery.radiusKm * 1000) && (
                <>
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px flex-1 bg-stone-200" />
                    <p className="text-xs text-stone-400 whitespace-nowrap">Beyond {committedQuery.radiusKm} km in wider area</p>
                    <div className="h-px flex-1 bg-stone-200" />
                  </div>
                  {displayed
                    .filter(h => h.distanceM > committedQuery.radiusKm * 1000)
                    .map(h => (
                      <HotelCard
                        key={h.placeId}
                        hotel={h}
                        distanceM={h.distanceM}
                        onEmail={() => setModalHotel(h)}
                        checkIn={committedQuery.checkIn}
                        checkOut={committedQuery.checkOut}
                        adults={committedQuery.adults}
                      />
                    ))}
                </>
              )}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="mt-4 text-center text-xs text-stone-400">
              {hasMore
                ? (loadingMore
                    ? <span className="animate-pulse">Loading more…</span>
                    : <span>{displayCount} of {allSorted.length} · {allSorted.length - displayCount} remaining</span>)
                : <span>— End of results —</span>
              }
            </div>
          </>
        )}
      </div>

      {/* Inquiry Modal */}
      {modalHotel && (
        <InquiryModal
          hotel={modalHotel}
          booking={bookingCtx}
          onClose={() => setModalHotel(null)}
        />
      )}
    </div>
  );
}
