const mySections = [
    {
        "id": "hats",
        "name": "Hats and caps",
        "maxEquip": 1
    },
    {
        "id": "cape_armlets",
        "name": "Cape Armlets",
        "maxEquip": 1
    }
];

const myItems = [
    {
        "id": "hats_mcc-crown_by_mrkazanek_1",
        "name": "MCC Crown",
        "sectionId": "hats",
        "type": "all",
        "description": "Crown inspired by the popular MCC server design",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/DHFr25g5/hats-mcc-crown-by-mrkazanek-1.png"
    },
    {
        "id": "cape_armlets_mojang_office_by_qozaworks_1",
        "name": "Mojang Office",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Perfect armlets to match the Mojang Office Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/QjFL1HJp/cape-armlets-mojang-office-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_mojang_office_by_qozaworks_2",
        "name": "Mojang Office",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Perfect armlets to match the Mojang Office Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/8nCHt8Sw/cape-armlets-mojang-office-by-qozaworks-2.png"
    },
    {
        "id": "cape_armlets_mcc_by_qozaworks_1",
        "name": "MCC",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Red and gold armlets matching the MCC Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/fYBcr9ZC/cape-armlets-mcc-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_mcc_by_qozaworks_2",
        "name": "MCC",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Red and gold armlets matching the MCC Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/Wpv9rXm5/cape-armlets-mcc-by-qozaworks-2.png"
    },
    {
        "id": "cape_armlets_menace_by_qozaworks_1",
        "name": "Menace",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Perfect armlets for the Menace Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/yHc71rN/cape-armlets-menace-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_menace_by_qozaworks_2",
        "name": "Menace",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Perfect armlets for the Menace Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/yBbx8Y4T/cape-armlets-menace-by-qozaworks-2.png"
    },
    {
        "id": "cape_armlets_home_by_qozaworks_1",
        "name": "Home",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Armlets for the Home Cape with green accents.",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/HTZVT2tN/cape-armlets-home-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_home_by_qozaworks_2",
        "name": "Home",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Armlets for the Home Cape with green accents.",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/fddLd31p/cape-armlets-home-by-qozaworks-2.png"
    },
    {
        "id": "cape_armlets_yearn_by_qozaworks_1",
        "name": "Yearn",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Mining armlets for the Yearn Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/qMddMVsr/cape-armlets-yearn-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_yearn_by_qozaworks_2",
        "name": "Yearn",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Mining armlets for the Yearn Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/vCpxsNxP/cape-armlets-yearn-by-qozaworks-2.png"
    },
    {
        "id": "cape_armlets_minecraft_experience_by_qozaworks_1",
        "name": "Minecraft Experience",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Armlets for the Minecraft Experience Cape given out at the IRL event",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/BFTQQmF/cape-armlets-minecraft-experience-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_common_by_qozaworks_1",
        "name": "Common",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Armlets supposedly for a Common Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/pjQc4q7H/cape-armlets-common-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_common_by_qozaworks_2",
        "name": "Common",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Armlets supposedly for a Common Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/m5ct43F9/cape-armlets-common-by-qozaworks-2.png"
    },
    {
        "id": "cape_armlets_pan_by_qozaworks_1",
        "name": "Pan",
        "sectionId": "cape_armlets",
        "type": "steve",
        "description": "Pancake armlets for the Pan Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/fYW9DXcm/cape-armlets-pan-by-qozaworks-1.png"
    },
    {
        "id": "cape_armlets_pan_by_qozaworks_2",
        "name": "Pan",
        "sectionId": "cape_armlets",
        "type": "alex",
        "description": "Pancake armlets for the Pan Cape",
        "author": {
            "name": "QozaWorks",
            "url": ""
        },
        "textureUrl": "https://i.ibb.co/XZYxGSyX/cape-armlets-pan-by-qozaworks-2.png"
    }
];
