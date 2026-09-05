"""Crop encyclopedia catalog and rotation advice services"""

PAKISTANI_CROPS_CATALOG = [
    {
        "crop_id": "wheat",
        "name": "Wheat",
        "local_name": "Gandum (گندم)",
        "season": "Rabi",
        "season_months": "Nov - Apr",
        "water_requirement_mm": 400,
        "water_range": "350 - 500 mm",
        "optimal_soil_moisture_percent": {"min": 25.0, "max": 35.0},
        "soil_ph_range": "6.0 - 7.5",
        "growth_duration_days": 140,
        "description": "Primary Rabi staple crop in Pakistan. Requires critical irrigation during crown root initiation and grain filling stages.",
        "common_diseases": [
            {
                "name": "Leaf Rust (Puccinia triticina)",
                "symptoms": "Small, round orange-brown pustules on leaves",
                "risk_factor": "High humidity & warm temperatures"
            },
            {
                "name": "Stripe Rust (Yellow Rust)",
                "symptoms": "Yellow streaks along leaf veins",
                "risk_factor": "Cool, moist weather during early spring"
            },
            {
                "name": "Terminal Heat & Water Stress",
                "symptoms": "Premature shriveling of grains during March/April maturity",
                "risk_factor": "High ambient temperatures (>32°C) combined with soil moisture < 20%"
            }
        ],
        "recommended_rotation_crops": ["cotton", "rice", "sugarcane"],
        "rotation_benefits": "Balances soil organic matter after Kharif heavy feeders like Cotton and Rice."
    },
    {
        "crop_id": "rice",
        "name": "Rice / Paddy",
        "local_name": "Chawal (چاول / دھان)",
        "season": "Kharif",
        "season_months": "May - Nov",
        "water_requirement_mm": 1400,
        "water_range": "1200 - 1600 mm",
        "optimal_soil_moisture_percent": {"min": 45.0, "max": 65.0},
        "soil_ph_range": "5.5 - 7.0",
        "growth_duration_days": 120,
        "description": "High water requirement Kharif crop widely cultivated in Punjab (Basmati) and Sindh (IRRI). Requires puddle flooded conditions.",
        "common_diseases": [
            {
                "name": "Bacterial Leaf Blight (Xanthomonas oryzae)",
                "symptoms": "Water-soaked lesions on leaf margins turning pale yellow to white",
                "risk_factor": "High rainfall, humidity >80%, over-fertilization of Nitrogen"
            },
            {
                "name": "Rice Blast (Magnaporthe oryzae)",
                "symptoms": "Spindle-shaped lesions with grayish centers on leaves and collar",
                "risk_factor": "Cool nights, high relative humidity, excessive Nitrogen"
            },
            {
                "name": "Moisture Deficit Anomaly",
                "symptoms": "Leaf rolling and root desiccation due to water shortage",
                "risk_factor": "Soil moisture drops below 35% during tillering or flowering"
            }
        ],
        "recommended_rotation_crops": ["wheat", "berseem"],
        "rotation_benefits": "Rotating flooded paddy with winter Wheat helps break soil compaction and anaerobic bacterial cycles."
    },
    {
        "crop_id": "cotton",
        "name": "Cotton",
        "local_name": "Kapaas (کپاس)",
        "season": "Kharif",
        "season_months": "May - Nov",
        "water_requirement_mm": 850,
        "water_range": "700 - 1000 mm",
        "optimal_soil_moisture_percent": {"min": 20.0, "max": 30.0},
        "soil_ph_range": "6.0 - 8.0",
        "growth_duration_days": 165,
        "description": "Major cash crop in Southern Punjab and Sindh. Extremely sensitive to waterlogging and leaf curl virus outbreaks.",
        "common_diseases": [
            {
                "name": "Cotton Leaf Curl Virus (CLCv)",
                "symptoms": "Upward or downward curling of leaf margins, vein thickening, enation",
                "risk_factor": "Whitefly pest vector explosion in hot dry weather"
            },
            {
                "name": "Pink Bollworm Infestation",
                "symptoms": "Rosetted flowers, damaged bolls with lint staining",
                "risk_factor": "Late season boll formation"
            },
            {
                "name": "Waterlogging / Over-irrigation Stress",
                "symptoms": "Wilting and root asphyxiation due to standing water",
                "risk_factor": "Soil moisture exceeding 40% for >48 hours"
            }
        ],
        "recommended_rotation_crops": ["wheat", "pulses"],
        "rotation_benefits": "Deep taproot system of Cotton aerates lower soil profile, leaving excellent seedbed structure for Rabi Wheat."
    },
    {
        "crop_id": "sugarcane",
        "name": "Sugarcane",
        "local_name": "Ganna (گنا)",
        "season": "Annual",
        "season_months": "Feb - Feb (12 Months)",
        "water_requirement_mm": 2000,
        "water_range": "1500 - 2500 mm",
        "optimal_soil_moisture_percent": {"min": 40.0, "max": 50.0},
        "soil_ph_range": "6.0 - 7.5",
        "growth_duration_days": 360,
        "description": "High yield annual crop supplying sugar mills. Requires continuous moderate moisture and heavy nutrient uptake.",
        "common_diseases": [
            {
                "name": "Red Rot (Colletotrichum falcatum)",
                "symptoms": "Reddening of internal stalk tissues with white transverse bands, sour odor",
                "risk_factor": "Excess monsoon humidity and waterlogged soil conditions"
            },
            {
                "name": "Whip Smut",
                "symptoms": "Black whip-like structure emerging from growing shoot apex",
                "risk_factor": "Ratoon crop propagation and infected seed cane"
            },
            {
                "name": "Drought / Canopy Desiccation",
                "symptoms": "Stunted cane elongation and dry leaf sheaths",
                "risk_factor": "Soil moisture dropping below 25% during summer formative stage"
            }
        ],
        "recommended_rotation_crops": ["wheat", "pulses", "mustard"],
        "rotation_benefits": "Followed by leguminous pulses or Wheat to restore nitrogen depleted by long sugarcane harvest cycles."
    }
]

def get_all_crops() -> list:
    """Return all crops from catalog"""
    return PAKISTANI_CROPS_CATALOG

def get_crop_by_id(crop_id: str) -> dict:
    """Return a single crop by ID (or None if not found)"""
    if not crop_id:
        return None
    crop_id_clean = crop_id.lower().strip()
    for crop in PAKISTANI_CROPS_CATALOG:
        if crop["crop_id"] == crop_id_clean:
            return crop
    return None

def generate_rotation_advice(current_crop_type: str) -> dict:
    """
    Generate dynamic crop rotation suggestions based on current active crop.
    This provides smart guidance for farmers without forcing decisions.
    """
    current_clean = (current_crop_type or "").lower().strip()
    current_crop = get_crop_by_id(current_clean)
    
    if not current_crop:
        return {
            "current_crop": current_crop_type or "Unspecified",
            "suggested_crops": [
                {
                    "crop_id": "wheat",
                    "name": "Wheat (Gandum)",
                    "season": "Rabi",
                    "rationale": "Ideal winter staple crop across Punjab & Sindh."
                },
                {
                    "crop_id": "cotton",
                    "name": "Cotton (Kapaas)",
                    "season": "Kharif",
                    "rationale": "Ideal summer cash crop with deep root soil aeration."
                }
            ],
            "rotation_tip": "Select a primary crop to receive customized seasonal rotation guidance."
        }
    
    suggestions = []
    for rec_id in current_crop.get("recommended_rotation_crops", []):
        rec_crop = get_crop_by_id(rec_id)
        if rec_crop:
            suggestions.append({
                "crop_id": rec_crop["crop_id"],
                "name": f"{rec_crop['name']} ({rec_crop['local_name']})",
                "season": rec_crop["season"],
                "season_months": rec_crop["season_months"],
                "water_requirement_mm": rec_crop["water_requirement_mm"],
                "rationale": f"Ideal target after {current_crop['name']} harvest. {rec_crop['rotation_benefits']}"
            })
            
    return {
        "current_crop": {
            "crop_id": current_crop["crop_id"],
            "name": current_crop["name"],
            "local_name": current_crop["local_name"],
            "season": current_crop["season"]
        },
        "suggested_crops": suggestions,
        "rotation_tip": f"💡 After harvesting {current_crop['name']} ({current_crop['season']} season), planting one of the recommended crops above restores soil structure and suppresses persistent pest cycles."
    }
