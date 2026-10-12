import type { Request, Response } from 'express';

// Standard 10th digit VIN year lookup table (1980-2029)
const VIN_YEAR_MAP: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
  '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
  '6': 2006, '7': 2007, '8': 2008, '9': 2009,
};

export const scanVinFromImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Image data (base64 string or data URL) is required.' });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ 
        error: 'OpenAI API key is not configured in backend environment variables.' 
      });
      return;
    }

    // Format data URL properly for OpenAI vision API
    let imageUrl = image.trim();
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${imageUrl}`;
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert commercial truck, trailer, and automotive VIN scanner.
Analyze the provided photograph (VIN sticker, door jamb label, cab barcode/plate, title document, or registration).
Extract the following information and return ONLY valid JSON:
- "vin": The 17-character Vehicle Identification Number. Remove all hyphens, spaces, and punctuation. VINs use standard uppercase characters and do not contain letters I, O, Q. If a 17-char VIN is found, return it uppercase. If only partial or not found, return empty string "".
- "unitNumber": Truck unit number if visible on cab, sticker, or paperwork (e.g., "104", "T-15", "502"), else empty string "".
- "year": Model year as 4-digit number (e.g. 2022) if visible, else null.
- "make": Truck/vehicle make (e.g., "Freightliner", "Peterbilt", "Kenworth", "Volvo", "International", "Mack", "Western Star", "Ford"), else empty string "".
- "model": Model name/number (e.g., "Cascadia", "579", "T680", "VNL", "LT", "Pinnacle"), else empty string "".
- "licensePlate": License plate if visible, else empty string "".
- "confidence": "HIGH" if a clean 17-char VIN is clearly visible, "MEDIUM" if estimated, "LOW" if unclear.

Expected format:
{
  "vin": "1XKAD49X4NJ123456",
  "unitNumber": "104",
  "year": 2022,
  "make": "Peterbilt",
  "model": "579",
  "licensePlate": "",
  "confidence": "HIGH"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the vehicle VIN number and any visible specifications from this photo.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 400,
        temperature: 0.1,
      })
    });

    if (!openAiResponse.ok) {
      const errText = await openAiResponse.text();
      console.error('OpenAI Vision API Error:', errText);
      res.status(502).json({ error: 'AI processing failed. Please try a clearer image or enter manually.' });
      return;
    }

    const aiData = await openAiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      res.status(502).json({ error: 'No content received from AI scanner.' });
      return;
    }

    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(content);
    } catch {
      res.status(502).json({ error: 'Invalid response format from AI scanner.' });
      return;
    }

    // Clean and validate VIN format
    if (parsedResult.vin) {
      parsedResult.vin = parsedResult.vin.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      // If year was not found on sticker, check 10th digit of 17-char VIN
      if (!parsedResult.year && parsedResult.vin.length === 17) {
        const tenthChar = parsedResult.vin.charAt(9);
        if (VIN_YEAR_MAP[tenthChar]) {
          parsedResult.year = VIN_YEAR_MAP[tenthChar];
        }
      }
    }

    res.status(200).json({
      success: true,
      data: parsedResult
    });
  } catch (error: any) {
    console.error('Error in scanVinFromImage:', error);
    res.status(500).json({ error: error.message || 'Internal server error processing VIN image.' });
  }
};
