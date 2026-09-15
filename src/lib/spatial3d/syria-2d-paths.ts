// 2D Syrian Sovereign Territorial Boundaries
// Sourced from syrian.zone/syid with Golan unified and Damascus cut to 1/3 of the Damascus/Rif Dimashq block.
// Colors match the official Syrian Visual Identity (SyID) palette.

export interface Syria2DGovernorate {
  id: string;
  nameAr: string;
  nameEn: string;
  path: string;
  center: [number, number];
}

export const SYRIA_2D_VIEWBOX = '0 0 1000 880';

export const SYRIA_2D_GOVERNORATES: Syria2DGovernorate[] = [
  {
    "id": "homs",
    "nameAr": "\u062d\u0645\u0635",
    "nameEn": "Homs",
    "path": "M 184 532 L 189 543 L 221 539 L 247 581 L 314 578 L 502 615 L 518 646 L 653 564 L 558 424 L 547 387 L 438 354 L 409 355 L 402 402 L 368 433 L 335 398 L 306 408 L 306 422 L 239 439 L 227 420 L 173 424 L 159 439 L 146 429 L 122 474 L 168 475 L 151 496 L 182 511 L 184 531 L 184 532 Z",
    "center": [
      411.0,
      498.6
    ]
  },
  {
    "id": "rif_dimashq",
    "nameAr": "\u0631\u064a\u0641 \u062f\u0645\u0634\u0642",
    "nameEn": "Rif Dimashq",
    "path": "M 315 579 L 502 615 L 518 646 L 303 781 L 238 723 L 238 570 L 283 587 L 314 578 L 315 579 Z",
    "center": [
      348.5,
      664.6
    ]
  },
  {
    "id": "as_suwayda",
    "nameAr": "\u0627\u0644\u0633\u0648\u064a\u062f\u0627\u0621",
    "nameEn": "As-Suwayda",
    "path": "M 226 709 L 214 697 L 174 703 L 179 732 L 152 741 L 175 833 L 218 840 L 303 781 L 227 710 L 226 709 Z",
    "center": [
      217.2,
      770.1
    ]
  },
  {
    "id": "quneitra",
    "nameAr": "\u0627\u0644\u0642\u0646\u064a\u0637\u0631\u0629 \u0648\u0627\u0644\u062c\u0648\u0644\u0627\u0646",
    "nameEn": "Quneitra & Golan",
    "path": "M 76 773 L 60 782 L 58 690 L 83 676 L 103 694 L 106 740 L 76 773 Z",
    "center": [
      79.7,
      725.7
    ]
  },
  {
    "id": "daraa",
    "nameAr": "\u062f\u0631\u0639\u0627",
    "nameEn": "Daraa",
    "path": "M 93 752 L 77 772 L 175 833 L 152 749 L 179 732 L 175 687 L 157 702 L 138 687 L 102 701 L 106 740 L 94 752 L 93 752 Z",
    "center": [
      135.2,
      755.2
    ]
  },
  {
    "id": "aleppo",
    "nameAr": "\u062d\u0644\u0628",
    "nameEn": "Aleppo",
    "path": "M 438 222 L 464 151 L 449 155 L 452 128 L 422 109 L 392 107 L 301 153 L 250 152 L 238 131 L 195 120 L 183 148 L 187 203 L 207 200 L 218 216 L 200 233 L 236 287 L 258 287 L 253 321 L 304 340 L 398 355 L 412 325 L 391 300 L 378 233 L 396 206 L 420 230 L 436 222 L 438 222 Z",
    "center": [
      322.5,
      219.2
    ]
  },
  {
    "id": "hama",
    "nameAr": "\u062d\u0645\u0627\u0629",
    "nameEn": "Hama",
    "path": "M 159 301 L 136 295 L 143 403 L 125 419 L 152 440 L 221 420 L 236 440 L 272 432 L 335 398 L 368 433 L 402 402 L 409 355 L 269 325 L 249 350 L 191 355 L 160 330 L 162 304 L 159 301 Z",
    "center": [
      258.0,
      379.8
    ]
  },
  {
    "id": "idlib",
    "nameAr": "\u0625\u062f\u0644\u0628",
    "nameEn": "Idlib",
    "path": "M 183 218 L 158 220 L 157 254 L 132 265 L 128 290 L 162 304 L 160 330 L 177 351 L 249 350 L 267 328 L 249 306 L 258 287 L 236 287 L 200 233 L 218 218 L 207 200 L 183 218 Z",
    "center": [
      196.4,
      289.7
    ]
  },
  {
    "id": "damascus",
    "nameAr": "\u062f\u0645\u0634\u0642",
    "nameEn": "Damascus",
    "path": "M 237 723 L 215 698 L 183 703 L 174 686 L 158 702 L 138 687 L 107 705 L 83 676 L 115 642 L 99 630 L 116 604 L 159 602 L 150 579 L 216 536 L 238 558 L 238 723 L 237 723 Z",
    "center": [
      176.8,
      633.7
    ]
  },
  {
    "id": "tartus",
    "nameAr": "\u0637\u0631\u0637\u0648\u0633",
    "nameEn": "Tartus",
    "path": "M 93 417 L 104 475 L 122 475 L 150 438 L 125 420 L 141 409 L 140 374 L 99 375 L 93 417 Z",
    "center": [
      117.1,
      423.2
    ]
  },
  {
    "id": "latakia",
    "nameAr": "\u0627\u0644\u0644\u0627\u0630\u0642\u064a\u0629",
    "nameEn": "Latakia",
    "path": "M 100 375 L 129 380 L 139 368 L 141 302 L 108 265 L 81 279 L 87 297 L 70 322 L 100 375 Z",
    "center": [
      110.0,
      324.7
    ]
  },
  {
    "id": "hasakeh",
    "nameAr": "\u0627\u0644\u062d\u0633\u0643\u0629",
    "nameEn": "Al-Hasakah",
    "path": "M 701 285 L 738 319 L 805 328 L 802 196 L 816 170 L 870 160 L 891 140 L 942 82 L 939 54 L 921 40 L 898 63 L 831 80 L 732 72 L 558 142 L 683 267 L 701 285 Z",
    "center": [
      750.7,
      172.9
    ]
  },
  {
    "id": "deir_ez_zor",
    "nameAr": "\u062f\u064a\u0631 \u0627\u0644\u0632\u0648\u0631",
    "nameEn": "Deir ez-Zor",
    "path": "M 790 394 L 805 328 L 731 314 L 632 224 L 606 180 L 583 241 L 590 292 L 532 377 L 653 564 L 760 512 L 793 452 L 791 399 L 790 394 Z",
    "center": [
      668.7,
      390.8
    ]
  },
  {
    "id": "raqqa",
    "nameAr": "\u0627\u0644\u0631\u0642\u0629",
    "nameEn": "Ar-Raqqa",
    "path": "M 586 294 L 583 241 L 606 177 L 571 165 L 558 142 L 468 140 L 452 128 L 449 155 L 464 151 L 452 209 L 423 230 L 396 206 L 378 233 L 391 300 L 412 325 L 398 355 L 532 377 L 582 298 L 586 294 Z",
    "center": [
      495.7,
      256.3
    ]
  }
];
