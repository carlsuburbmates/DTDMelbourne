-- ============================================================================
-- DTD Phase 1: Database Schema - Seed Data
-- File: 005_seed_data.sql
-- Description: Seed data for 28 councils and 200+ suburbs
-- ============================================================================

-- ============================================================================
-- SEED COUNCILS (28 Melbourne Metropolitan Councils)
-- ============================================================================

-- Inner City (3 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Melbourne', 'Inner City', FALSE, 'Melbourne CBD'),
('City of Port Phillip', 'Inner City', FALSE, 'St Kilda Beachside'),
('City of Yarra', 'Inner City', FALSE, 'Inner North Creative');

-- Northern (6 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Banyule', 'Northern', FALSE, 'Heidelberg Foothills'),
('City of Darebin', 'Northern', FALSE, 'Preston Inner North'),
('City of Hume', 'Northern', FALSE, 'Broadmeadows Outer North'),
('City of Merri-bek', 'Northern', FALSE, 'Brunswick Inner West'),
('City of Whittlesea', 'Northern', FALSE, 'Epping Growth Corridor'),
('Shire of Nillumbik', 'Northern', TRUE, 'Eltham Dandenong Hills');

-- Eastern (6 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Boroondara', 'Eastern', FALSE, 'Hawthorn Eastern Prestige'),
('City of Knox', 'Eastern', FALSE, 'Boronia Mountain Suburbs'),
('City of Manningham', 'Eastern', FALSE, 'Doncaster Eastern Leafy'),
('City of Maroondah', 'Eastern', FALSE, 'Ringwood Eastern Corridor'),
('City of Whitehorse', 'Eastern', FALSE, 'Box Hill Eastern Residential'),
('Shire of Yarra Ranges', 'Eastern', TRUE, 'Lilydale Dandenong Ranges');

-- South Eastern (7 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Bayside', 'South Eastern', FALSE, 'Brighton Bayside'),
('City of Glen Eira', 'South Eastern', FALSE, 'Caulfield Southeastern'),
('City of Kingston', 'South Eastern', FALSE, 'Mentone Bayside'),
('City of Casey', 'South Eastern', FALSE, 'Narre Warren Outer South'),
('City of Frankston', 'South Eastern', FALSE, 'Frankston Peninsula'),
('Shire of Cardinia', 'South Eastern', TRUE, 'Pakenham Outer Southeast'),
('Mornington Peninsula Shire', 'South Eastern', TRUE, 'Mornington Peninsula');

-- Western (6 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Brimbank', 'Western', FALSE, 'Sunshine Western Industrial'),
('City of Hobsons Bay', 'Western', FALSE, 'Williamstown Western Coastal'),
('City of Maribyrnong', 'Western', FALSE, 'Footscray Inner West'),
('City of Melton', 'Western', FALSE, 'Melton Western Growth'),
('City of Moonee Valley', 'Western', FALSE, 'Essendon Northern West'),
('City of Wyndham', 'Western', FALSE, 'Werribee Southwest Growth');

-- ============================================================================
-- SEED SUBURBS (200+ Melbourne Suburbs)
-- ============================================================================

-- Inner City - City of Melbourne (id: 1)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Carlton', 1, 'Inner City', '3053', -37.8004228, 144.9684343, 'Melbourne CBD'),
('Docklands', 1, 'Inner City', '3008', -37.8175423, 144.9394923, 'Melbourne CBD'),
('Parkville', 1, 'Inner City', '3052', -37.7871148, 144.9515533, 'Melbourne CBD'),
('Kensington', 1, 'Inner City', '3031', -37.7939378, 144.9305645, 'Melbourne CBD'),
('North Melbourne', 1, 'Inner City', '3003', -37.8076092, 144.9423514, 'Melbourne CBD'),
('West Melbourne', 1, 'Inner City', '3005', -37.8167425, 144.9496173, 'Melbourne CBD'),
('East Melbourne', 1, 'Inner City', '3002', -37.8136279, 144.9837306, 'Melbourne CBD'),
('Southbank', 1, 'Inner City', '3006', -37.8293599, 144.9631738, 'Melbourne CBD'),
('South Wharf', 1, 'Inner City', '3005', -37.8208561, 144.9314667, 'Melbourne CBD');

-- Inner City - City of Port Phillip (id: 2)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Albert Park', 2, 'Inner City', '3206', -37.8452062, 144.9571050, 'St Kilda Beachside'),
('Balaclava', 2, 'Inner City', '3183', -37.8695430, 144.9934871, 'St Kilda Beachside'),
('Elwood', 2, 'Inner City', '3184', -37.8788568, 144.9855487, 'St Kilda Beachside'),
('Port Melbourne', 2, 'Inner City', '3207', -37.8398444, 144.9428127, 'St Kilda Beachside'),
('Ripponlea', 2, 'Inner City', '3192', -37.8469444, 144.98894347, 'St Kilda Beachside'),
('South Melbourne', 2, 'Inner City', '3205', -37.8334400, 144.9570533, 'St Kilda Beachside'),
('St Kilda', 2, 'Inner City', '3182', -37.8638261, 144.9816370, 'St Kilda Beachside'),
('St Kilda East', 2, 'Inner City', '3183', -37.8799210, 144.9954640, 'St Kilda Beachside'),
('St Kilda West', 2, 'Inner City', '3182', -37.8486830, 144.9703540, 'St Kilda Beachside'),
('Windsor', 2, 'Inner City', '3181', -37.8523590, 144.9874320, 'St Kilda Beachside');

-- Inner City - City of Yarra (id: 3)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Abbotsford', 3, 'Inner City', '3067', -37.8045508, 144.9988542, 'Inner North Creative'),
('Collingwood', 3, 'Inner City', '3066', -37.8021040, 144.9881387, 'Inner North Creative'),
('Fitzroy', 3, 'Inner City', '3065', -37.8010382, 144.9792611, 'Inner North Creative'),
('Fitzroy North', 3, 'Inner City', '3068', -37.7918240, 144.9959120, 'Inner North Creative'),
('Richmond', 3, 'Inner City', '3121', -37.8074500, 144.9907213, 'Inner North Creative'),
('Burnley', 3, 'Inner City', '3121', -37.8189170, 145.0123170, 'Inner North Creative'),
('Cremorne', 3, 'Inner City', '3121', -37.8250140, 145.0284170, 'Inner North Creative');

-- Northern - City of Banyule (id: 4)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Bundoora', 4, 'Northern', '3083', -37.6915230, 145.0524690, 'Heidelberg Foothills'),
('Greensborough', 4, 'Northern', '3088', -37.7416990, 145.0999700, 'Heidelberg Foothills'),
('Ivanhoe', 4, 'Northern', '3079', -37.7666670, 145.0480560, 'Heidelberg Foothills'),
('Heidelberg', 4, 'Northern', '3084', -37.7524788, 145.0701284, 'Heidelberg Foothills'),
('Heidelberg West', 4, 'Northern', '3081', -37.7469440, 145.0419440, 'Heidelberg Foothills'),
('Montmorency', 4, 'Northern', '3094', -37.7247220, 145.1188780, 'Heidelberg Foothills'),
('Rosanna', 4, 'Northern', '3084', -37.7583330, 145.0794440, 'Heidelberg Foothills'),
('Viewbank', 4, 'Northern', '3131', -37.7708330, 145.1455560, 'Heidelberg Foothills');

-- Northern - City of Darebin (id: 5)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Bundoora', 5, 'Northern', '3083', -37.6915230, 145.0524690, 'Preston Inner North'),
('Preston', 5, 'Northern', '3072', -37.7418658, 145.0078205, 'Preston Inner North'),
('Reservoir', 5, 'Northern', '3073', -37.7322780, 145.0094440, 'Preston Inner North'),
('Thornbury', 5, 'Northern', '3071', -37.7219440, 145.0030560, 'Preston Inner North'),
('Northcote', 5, 'Northern', '3070', -37.7708330, 145.0038890, 'Preston Inner North'),
('Fairfield', 5, 'Northern', '3078', -37.7580560, 145.0186110, 'Preston Inner North'),
('Kingsbury', 5, 'Northern', '3108', -37.7494440, 145.0505560, 'Preston Inner North'),
('Watsonia', 5, 'Northern', '3087', -37.7152780, 145.0457220, 'Preston Inner North');

-- Northern - City of Hume (id: 6)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Broadmeadows', 6, 'Northern', '3047', -37.6997220, 144.9002780, 'Broadmeadows Outer North'),
('Craigieburn', 6, 'Northern', '3064', -37.5999440, 144.9500000, 'Broadmeadows Outer North'),
('Sunbury', 6, 'Northern', '3429', -37.5666670, 144.7333330, 'Broadmeadows Outer North'),
('Tullamarine', 6, 'Northern', '3043', -37.7158330, 144.8333330, 'Broadmeadows Outer North'),
('Roxburgh Park', 6, 'Northern', '3060', -37.6497220, 144.8333330, 'Broadmeadows Outer North'),
('Mickleham', 6, 'Northern', '3064', -37.6166670, 144.9166670, 'Broadmeadows Outer North'),
('Gladstone Park', 6, 'Northern', '3043', -37.7250000, 144.8333330, 'Broadmeadows Outer North');

-- Northern - City of Merri-bek (id: 7)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Brunswick', 7, 'Northern', '3056', -37.7666670, 144.9666670, 'Brunswick Inner West'),
('Brunswick East', 7, 'Northern', '3057', -37.7666670, 144.9833330, 'Brunswick Inner West'),
('Brunswick West', 7, 'Northern', '3055', -37.7666670, 144.9500000, 'Brunswick Inner West'),
('Coburg', 7, 'Northern', '3058', -37.7833330, 144.9666670, 'Brunswick Inner West'),
('Fawkner', 7, 'Northern', '3060', -37.7997220, 144.9833330, 'Brunswick Inner West'),
('Moreland', 7, 'Northern', '3058', -37.7833330, 144.9500000, 'Brunswick Inner West'),
('Pascoe Vale', 7, 'Northern', '3044', -37.7666670, 144.9333330, 'Brunswick Inner West'),
('Glenroy', 7, 'Northern', '3046', -37.7333330, 144.9166670, 'Brunswick Inner West');

-- Northern - City of Whittlesea (id: 8)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Epping', 8, 'Northern', '3076', -37.6166670, 145.0333330, 'Epping Growth Corridor'),
('Lalor', 8, 'Northern', '3075', -37.5666670, 145.0500000, 'Epping Growth Corridor'),
('Mill Park', 8, 'Northern', '3082', -37.5833330, 145.0833330, 'Epping Growth Corridor'),
('South Morang', 8, 'Northern', '3752', -37.5666670, 145.0833330, 'Epping Growth Corridor'),
('Wollert', 8, 'Northern', '3076', -37.6166670, 145.0333330, 'Epping Growth Corridor'),
('Thomastown', 8, 'Northern', '3074', -37.6166670, 145.0166670, 'Epping Growth Corridor'),
('Doreen', 8, 'Northern', '3754', -37.5666670, 145.0833330, 'Epping Growth Corridor');

-- Northern - Shire of Nillumbik (id: 9)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Eltham', 9, 'Northern', '3095', -37.8166670, 145.1833330, 'Eltham Dandenong Hills'),
('Diamond Creek', 9, 'Northern', '3089', -37.7833330, 145.2500000, 'Eltham Dandenong Hills'),
('Warrandyte', 9, 'Northern', '3113', -37.7333330, 145.2500000, 'Eltham Dandenong Hills'),
('Kangaroo Ground', 9, 'Northern', '3159', -37.6666670, 145.2500000, 'Eltham Dandenong Hills'),
('Research', 9, 'Northern', '3097', -37.7000000, 145.1833330, 'Eltham Dandenong Hills'),
('St Andrews', 9, 'Northern', '3761', -37.6166670, 145.2500000, 'Eltham Dandenong Hills'),
('Hurstbridge', 9, 'Northern', '3124', -37.7333330, 145.2500000, 'Eltham Dandenong Hills');

-- Eastern - City of Boroondara (id: 10)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Camberwell', 10, 'Eastern', '3124', -37.8384623, 145.0740767, 'Hawthorn Eastern Prestige'),
('Canterbury', 10, 'Eastern', '3126', -37.8166670, 145.0833330, 'Hawthorn Eastern Prestige'),
('Balwyn', 10, 'Eastern', '3103', -37.8166670, 145.1000000, 'Hawthorn Eastern Prestige'),
('Surrey Hills', 10, 'Eastern', '3127', -37.8666670, 145.1166670, 'Hawthorn Eastern Prestige'),
('Kew', 10, 'Eastern', '3101', -37.8166670, 145.0333330, 'Hawthorn Eastern Prestige'),
('Hawthorn', 10, 'Eastern', '3122', -37.8333330, 145.0500000, 'Hawthorn Eastern Prestige'),
('Ashburton', 10, 'Eastern', '3147', -37.8500000, 145.1000000, 'Hawthorn Eastern Prestige'),
('Glen Iris', 10, 'Eastern', '3146', -37.8333330, 145.1500000, 'Hawthorn Eastern Prestige');

-- Eastern - City of Knox (id: 11)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Boronia', 11, 'Eastern', '3155', -37.8500000, 145.3166670, 'Boronia Mountain Suburbs'),
('Ferntree Gully', 11, 'Eastern', '3156', -37.8833330, 145.3166670, 'Boronia Mountain Suburbs'),
('Knoxfield', 11, 'Eastern', '3180', -37.8833330, 145.2500000, 'Boronia Mountain Suburbs'),
('Rowville', 11, 'Eastern', '3178', -37.8666670, 145.2500000, 'Boronia Mountain Suburbs'),
('Scoresby', 11, 'Eastern', '3179', -37.8666670, 145.2166670, 'Boronia Mountain Suburbs'),
('Wantirna', 11, 'Eastern', '3152', -37.8500000, 145.2833330, 'Boronia Mountain Suburbs'),
('Lysterfield', 11, 'Eastern', '3158', -37.8666670, 145.2500000, 'Boronia Mountain Suburbs'),
('Upwey', 11, 'Eastern', '3158', -37.8666670, 145.2500000, 'Boronia Mountain Suburbs');

-- Eastern - City of Manningham (id: 12)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Doncaster', 12, 'Eastern', '3108', -37.7833330, 145.1166670, 'Doncaster Eastern Leafy'),
('Templestowe', 12, 'Eastern', '3106', -37.7666670, 145.1166670, 'Doncaster Eastern Leafy'),
('Bulleen', 12, 'Eastern', '3125', -37.8500000, 145.1500000, 'Doncaster Eastern Leafy'),
('Warrandyte', 12, 'Eastern', '3113', -37.7333330, 145.2500000, 'Doncaster Eastern Leafy'),
('Donvale', 12, 'Eastern', '3111', -37.7333330, 145.1500000, 'Doncaster Eastern Leafy'),
('Park Orchards', 12, 'Eastern', '3114', -37.7333330, 145.1500000, 'Doncaster Eastern Leafy'),
('Mitcham', 12, 'Eastern', '3132', -37.8500000, 145.1500000, 'Doncaster Eastern Leafy');

-- Eastern - City of Maroondah (id: 13)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Ringwood', 13, 'Eastern', '3134', -37.8158726, 145.2291113, 'Ringwood Eastern Corridor'),
('Croydon', 13, 'Eastern', '3136', -37.8166670, 145.2500000, 'Ringwood Eastern Corridor'),
('Ringwood East', 13, 'Eastern', '3135', -37.8166670, 145.2500000, 'Ringwood Eastern Corridor'),
('Ringwood North', 13, 'Eastern', '3134', -37.8166670, 145.2166670, 'Ringwood Eastern Corridor'),
('Vermont', 13, 'Eastern', '3133', -37.8166670, 145.2166670, 'Ringwood Eastern Corridor'),
('Heathmont', 13, 'Eastern', '3131', -37.8000000, 145.2833330, 'Ringwood Eastern Corridor'),
('Bayswater', 13, 'Eastern', '3153', -37.8500000, 145.2833330, 'Ringwood Eastern Corridor');

-- Eastern - City of Whitehorse (id: 14)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Box Hill', 14, 'Eastern', '3128', -37.8166670, 145.1166670, 'Box Hill Eastern Residential'),
('Blackburn', 14, 'Eastern', '3130', -37.8166670, 145.1500000, 'Box Hill Eastern Residential'),
('Blackburn North', 14, 'Eastern', '3130', -37.8166670, 145.1500000, 'Box Hill Eastern Residential'),
('Blackburn South', 14, 'Eastern', '3130', -37.8166670, 145.1500000, 'Box Hill Eastern Residential'),
('Nunawading', 14, 'Eastern', '3131', -37.8166670, 145.1833330, 'Box Hill Eastern Residential'),
('Forest Hill', 14, 'Eastern', '3131', -37.8166670, 145.1500000, 'Box Hill Eastern Residential'),
('Mitcham', 14, 'Eastern', '3132', -37.8500000, 145.1500000, 'Box Hill Eastern Residential'),
('Vermont', 14, 'Eastern', '3133', -37.8166670, 145.2166670, 'Box Hill Eastern Residential');

-- Eastern - Shire of Yarra Ranges (id: 15)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Lilydale', 15, 'Eastern', '3140', -37.8166670, 145.3500000, 'Lilydale Dandenong Ranges'),
('Mooroolbark', 15, 'Eastern', '3138', -37.8333330, 145.3500000, 'Lilydale Dandenong Ranges'),
('Belgrave', 15, 'Eastern', '3160', -37.8833330, 145.3500000, 'Lilydale Dandenong Ranges'),
('Upwey', 15, 'Eastern', '3158', -37.8666670, 145.2500000, 'Lilydale Dandenong Ranges'),
('Monbulk', 15, 'Eastern', '3179', -37.8666670, 145.3500000, 'Lilydale Dandenong Ranges'),
('Seville', 15, 'Eastern', '3139', -37.8500000, 145.3500000, 'Lilydale Dandenong Ranges'),
('Yarra Junction', 15, 'Eastern', '3129', -37.8166670, 145.3500000, 'Lilydale Dandenong Ranges');

-- South Eastern - City of Bayside (id: 16)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Brighton', 16, 'South Eastern', '3186', -37.9081962, 144.9957991, 'Brighton Bayside'),
('Brighton East', 16, 'South Eastern', '3187', -37.9166670, 145.0166670, 'Brighton Bayside'),
('Hampton', 16, 'South Eastern', '3188', -37.9333330, 145.0000000, 'Brighton Bayside'),
('Sandringham', 16, 'South Eastern', '3195', -37.9500000, 145.0333330, 'Brighton Bayside'),
('Black Rock', 16, 'South Eastern', '3193', -37.9333330, 145.0166670, 'Brighton Bayside'),
('Highett', 16, 'South Eastern', '3191', -37.9166670, 145.0500000, 'Brighton Bayside'),
('Cheltenham', 16, 'South Eastern', '3192', -37.8833330, 145.0500000, 'Brighton Bayside');

-- South Eastern - City of Glen Eira (id: 17)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Caulfield', 17, 'South Eastern', '3162', -37.8833330, 145.0333330, 'Caulfield Southeastern'),
('Caulfield North', 17, 'South Eastern', '3161', -37.8833330, 145.0166670, 'Caulfield Southeastern'),
('Caulfield South', 17, 'South Eastern', '3162', -37.8833330, 145.0500000, 'Caulfield Southeastern'),
('Caulfield East', 17, 'South Eastern', '3162', -37.8833330, 145.0833330, 'Caulfield Southeastern'),
('Glen Huntly', 17, 'South Eastern', '3146', -37.8666670, 145.0333330, 'Caulfield Southeastern'),
('Ormond', 17, 'South Eastern', '3204', -37.8833330, 145.0500000, 'Caulfield Southeastern'),
('Murrumbeena', 17, 'South Eastern', '3183', -37.8833330, 145.0166670, 'Caulfield Southeastern');

-- South Eastern - City of Kingston (id: 18)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Mentone', 18, 'South Eastern', '3194', -37.8833330, 145.0333330, 'Mentone Bayside'),
('Mordialloc', 18, 'South Eastern', '3195', -37.9166670, 145.0500000, 'Mentone Bayside'),
('Aspendale', 18, 'South Eastern', '3195', -37.9166670, 145.0500000, 'Mentone Bayside'),
('Parkdale', 18, 'South Eastern', '3199', -37.9333330, 145.0500000, 'Mentone Bayside'),
('Chelsea', 18, 'South Eastern', '3196', -37.9500000, 145.0666670, 'Mentone Bayside'),
('Bonbeach', 18, 'South Eastern', '3193', -37.9166670, 145.0500000, 'Mentone Bayside'),
('Carrum', 18, 'South Eastern', '3197', -37.9666670, 145.0833330, 'Mentone Bayside');

-- South Eastern - City of Casey (id: 19)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Narre Warren', 19, 'South Eastern', '3805', -38.0333330, 145.3166670, 'Narre Warren Outer South'),
('Berwick', 19, 'South Eastern', '3806', -38.0333330, 145.3500000, 'Narre Warren Outer South'),
('Cranbourne', 19, 'South Eastern', '3977', -38.1000000, 145.5333330, 'Narre Warren Outer South'),
('Hallam', 19, 'South Eastern', '3803', -38.0166670, 145.2833330, 'Narre Warren Outer South'),
('Pakenham', 19, 'South Eastern', '3810', -38.0666670, 145.4666670, 'Narre Warren Outer South'),
('Officer', 19, 'South Eastern', '3809', -38.0500000, 145.3500000, 'Narre Warren Outer South'),
('Beaconsfield', 19, 'South Eastern', '3807', -38.0500000, 145.3500000, 'Narre Warren Outer South');

-- South Eastern - City of Frankston (id: 20)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Frankston', 20, 'South Eastern', '3199', -38.1457064, 145.1263742, 'Frankston Peninsula'),
('Seaford', 20, 'South Eastern', '3198', -38.1166670, 145.1500000, 'Frankston Peninsula'),
('Karingal', 20, 'South Eastern', '3199', -38.1333330, 145.1500000, 'Frankston Peninsula'),
('Carrum Downs', 20, 'South Eastern', '3977', -38.1000000, 145.5333330, 'Frankston Peninsula'),
('Langwarrin', 20, 'South Eastern', '3986', -38.1500000, 145.5666670, 'Frankston Peninsula'),
('Somerville', 20, 'South Eastern', '3912', -38.0833330, 145.4166670, 'Frankston Peninsula'),
('Tyabb', 20, 'South Eastern', '3980', -38.1333330, 145.5666670, 'Frankston Peninsula');

-- South Eastern - Shire of Cardinia (id: 21)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Pakenham', 21, 'South Eastern', '3810', -38.0666670, 145.4666670, 'Pakenham Outer Southeast'),
('Koo Wee Rup', 21, 'South Eastern', '3981', -38.1333330, 145.5666670, 'Pakenham Outer Southeast'),
('Cockatoo', 21, 'South Eastern', '3981', -38.1333330, 145.5666670, 'Pakenham Outer Southeast'),
('Emerald', 21, 'South Eastern', '3782', -37.9333330, 145.4666670, 'Pakenham Outer Southeast'),
('Beaconsfield Upper', 21, 'South Eastern', '3807', -38.0500000, 145.3500000, 'Pakenham Outer Southeast'),
('Officer', 21, 'South Eastern', '3809', -38.0500000, 145.3500000, 'Pakenham Outer Southeast'),
('Tynong', 21, 'South Eastern', '3813', -38.0833330, 145.4666670, 'Pakenham Outer Southeast');

-- South Eastern - Mornington Peninsula Shire (id: 22)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Mornington', 22, 'South Eastern', '3931', -38.2166670, 145.3833330, 'Mornington Peninsula'),
('Sorrento', 22, 'South Eastern', '3943', -38.3500000, 145.4166670, 'Mornington Peninsula'),
('Rosebud', 22, 'South Eastern', '3941', -38.3666670, 145.4333330, 'Mornington Peninsula'),
('Hastings', 22, 'South Eastern', '3915', -38.3166670, 145.4166670, 'Mornington Peninsula'),
('Rye', 22, 'South Eastern', '3941', -38.3666670, 145.4333330, 'Mornington Peninsula'),
('Flinders', 22, 'South Eastern', '3929', -38.3500000, 145.4166670, 'Mornington Peninsula'),
('Crib Point', 22, 'South Eastern', '3939', -38.3833330, 145.4333330, 'Mornington Peninsula');

-- Western - City of Brimbank (id: 23)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Sunshine', 23, 'Western', '3020', -37.7887617, 144.8331303, 'Sunshine Western Industrial'),
('Albion', 23, 'Western', '3021', -37.7833330, 144.8166670, 'Sunshine Western Industrial'),
('Ardeer', 23, 'Western', '3022', -37.7833330, 144.8500000, 'Sunshine Western Industrial'),
('Keilor', 23, 'Western', '3036', -37.7333330, 144.8666670, 'Sunshine Western Industrial'),
('Keilor Downs', 23, 'Western', '3038', -37.7333330, 144.8833330, 'Sunshine Western Industrial'),
('St Albans', 23, 'Western', '3021', -37.7500000, 144.8000000, 'Sunshine Western Industrial'),
('Taylors Lakes', 23, 'Western', '3018', -37.7333330, 144.7833330, 'Sunshine Western Industrial');

-- Western - City of Hobsons Bay (id: 24)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Williamstown', 24, 'Western', '3016', -37.8611788, 144.8898569, 'Williamstown Western Coastal'),
('Newport', 24, 'Western', '3015', -37.8500000, 144.8833330, 'Williamstown Western Coastal'),
('Spotswood', 24, 'Western', '3015', -37.8500000, 144.9000000, 'Williamstown Western Coastal'),
('South Kingsville', 24, 'Western', '3015', -37.8500000, 144.9166670, 'Williamstown Western Coastal'),
('Altona', 24, 'Western', '3018', -37.8500000, 144.8833330, 'Williamstown Western Coastal'),
('Seaholme', 24, 'Western', '3018', -37.8500000, 144.9166670, 'Williamstown Western Coastal'),
('Werribee', 24, 'Western', '3030', -37.9079840, 144.6416748, 'Williamstown Western Coastal');

-- Western - City of Maribyrnong (id: 25)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Footscray', 25, 'Western', '3011', -37.7981339, 144.8973450, 'Footscray Inner West'),
('Seddon', 25, 'Western', '3011', -37.8166670, 144.9000000, 'Footscray Inner West'),
('Yarraville', 25, 'Western', '3013', -37.8166670, 144.9166670, 'Footscray Inner West'),
('Kingsville', 25, 'Western', '3012', -37.8166670, 144.8833330, 'Footscray Inner West'),
('West Footscray', 25, 'Western', '3012', -37.8166670, 144.8833330, 'Footscray Inner West'),
('Braybrook', 25, 'Western', '3011', -37.7833330, 144.9166670, 'Footscray Inner West'),
('Tottenham', 25, 'Western', '3012', -37.8166670, 144.8833330, 'Footscray Inner West');

-- Western - City of Melton (id: 26)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Melton', 26, 'Western', '3337', -37.6833330, 144.5833330, 'Melton Western Growth'),
('Caroline Springs', 26, 'Western', '3388', -37.7166670, 144.6166670, 'Melton Western Growth'),
('Rockbank', 26, 'Western', '3335', -37.6666670, 144.6166670, 'Melton Western Growth'),
('Bacchus Marsh', 26, 'Western', '3334', -37.6833330, 144.5833330, 'Melton Western Growth'),
('Toolern', 26, 'Western', '3338', -37.7166670, 144.6166670, 'Melton Western Growth'),
('Diggers Rest', 26, 'Western', '3337', -37.6833330, 144.5833330, 'Melton Western Growth'),
('Eynesbury', 26, 'Western', '3338', -37.7166670, 144.6166670, 'Melton Western Growth');

-- Western - City of Moonee Valley (id: 27)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Moonee Ponds', 27, 'Western', '3039', -37.7166670, 144.8333330, 'Essendon Northern West'),
('Essendon', 27, 'Western', '3040', -37.7500000, 144.9000000, 'Essendon Northern West'),
('Essendon North', 27, 'Western', '3040', -37.7500000, 144.9166670, 'Essendon Northern West'),
('Essendon West', 27, 'Western', '3040', -37.7500000, 144.8833330, 'Essendon Northern West'),
('Strathmore', 27, 'Western', '3041', -37.7500000, 144.8833330, 'Essendon Northern West'),
('Avondale Heights', 27, 'Western', '3038', -37.7333330, 144.8500000, 'Essendon Northern West'),
('Niddrie', 27, 'Western', '3042', -37.7166670, 144.9166670, 'Essendon Northern West');

-- Western - City of Wyndham (id: 28)
INSERT INTO suburbs (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Werribee', 28, 'Western', '3030', -37.9079840, 144.6416748, 'Werribee Southwest Growth'),
('Hoppers Crossing', 28, 'Western', '3029', -37.8833330, 144.7000000, 'Werribee Southwest Growth'),
('Tarneit', 28, 'Western', '3029', -37.8833330, 144.7166670, 'Werribee Southwest Growth'),
('Truganina', 28, 'Western', '3029', -37.8833330, 144.7166670, 'Werribee Southwest Growth'),
('Point Cook', 28, 'Western', '3030', -37.9166670, 144.6666670, 'Werribee Southwest Growth'),
('Wyndham Vale', 28, 'Western', '3024', -37.8833330, 144.6833330, 'Werribee Southwest Growth'),
('Laverton North', 28, 'Western', '3026', -37.8666670, 144.6833330, 'Werribee Southwest Growth'),
('Laverton South', 28, 'Western', '3026', -37.8666670, 144.6833330, 'Werribee Southwest Growth');

-- ============================================================================
-- SAMPLE TRAINER PROFILES (for testing)
-- ============================================================================

-- Sample trainer 1: Loose Lead Training
INSERT INTO businesses (
  name, resource_type, suburb_id, council_id, region,
  address, phone, email, website, description,
  age_specialties, behavior_issues, service_type_primary, service_type_secondary,
  abn, abn_verified, claimed, scaffolded, data_source, tier
)
SELECT
  'Loose Lead Training', 'trainer', s.id, s.council_id, s.region,
  '123 Brunswick Street, Fitzroy VIC 3065', '+61 3 9876 5432', 'alice@looseleadtraining.com', 'https://looseleadtraining.com.au',
  'Certified dog trainer with 10 years experience specialising in positive reinforcement methods.',
  ARRAY['Puppies (0–6m)', 'Adult (18m–7y)'],
  ARRAY['Pulling on lead', 'Separation anxiety'],
  'Obedience training',
  ARRAY['Private training', 'Group classes'],
  NULL, FALSE, FALSE, TRUE, 'manual_form', 'basic'
FROM suburbs s
WHERE s.name = 'Fitzroy'
LIMIT 1;

-- Sample trainer 2: Happy Paws Training
INSERT INTO businesses (
  name, resource_type, suburb_id, council_id, region,
  address, phone, email, website, description,
  age_specialties, behavior_issues, service_type_primary, service_type_secondary,
  abn, abn_verified, claimed, scaffolded, data_source, tier
)
SELECT
  'Happy Paws Training', 'trainer', s.id, s.council_id, s.region,
  '45 Doncaster Road, Doncaster VIC 3108', '+61 3 9123 4567', 'info@happypawstraining.com', 'https://happypawstraining.com.au',
  'Professional dog training services for all breeds and ages. We use science-based methods.',
  ARRAY['Puppies (0–6m)', 'Adolescent (6–18m)', 'Adult (18m–7y)'],
  ARRAY['Jumping up', 'Recall issues', 'Socialisation'],
  'Puppy training',
  ARRAY['Group classes'],
  NULL, FALSE, FALSE, TRUE, 'manual_form', 'basic'
FROM suburbs s
WHERE s.name = 'Doncaster'
LIMIT 1;

-- Sample emergency vet: MASH Ringwood
INSERT INTO businesses (
  name, resource_type, suburb_id, council_id, region,
  address, phone, email, website, description,
  emergency_phone, emergency_hours, emergency_services,
  abn, abn_verified, claimed, scaffolded, data_source, tier
)
SELECT
  'MASH Ringwood', 'emergency_vet', s.id, s.council_id, s.region,
  '5 Ringwood Street, Ringwood VIC 3134', '+61 3 9876 5600', 'emergency@mashringwood.com.au', 'https://mashringwood.com.au',
  '24-hour emergency veterinary hospital providing critical care for pets.',
  '+61 3 9876 5600', '24/7',
  ARRAY['Emergency surgery', 'Poison control', 'Critical care'],
  NULL, FALSE, FALSE, TRUE, 'manual_form', 'basic'
FROM suburbs s
WHERE s.name = 'Ringwood'
LIMIT 1;

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- 1. 28 councils seeded across 5 regions (Inner City, Northern, Eastern, South Eastern, Western)
-- 2. 200+ suburbs seeded with proper council_id and region mapping
-- 3. Sample trainer profiles for testing
-- 4. All data follows D-003 (28 councils, suburb auto-assignment)
-- 5. Lat/Long coordinates approximate suburb centroids
-- ============================================================================
