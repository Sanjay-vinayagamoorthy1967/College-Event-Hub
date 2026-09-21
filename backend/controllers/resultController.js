const EventResult = require('../models/EventResult');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

exports.getEventResults = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // We mock the old array structure if needed, or just return the event's embedded prizes
    res.status(200).json({ success: true, results: null }); // Unused now, getEventFullDetails is used
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching results', error: error.message });
  }
};

exports.addEventResult = async (req, res) => {
  try {
    const { firstPrize, secondPrize, thirdPrize } = req.body;
    const eventId = req.params.id;

    if (!firstPrize || !secondPrize || !thirdPrize) {
      return res.status(400).json({ success: false, message: 'Please provide all 3 winner positions.' });
    }

    const event = await Event.findByIdAndUpdate(eventId, { firstPrize, secondPrize, thirdPrize }, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, message: 'Results published successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error saving result', error: error.message });
  }
};

exports.deleteEventResult = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findByIdAndUpdate(eventId, { 
      $unset: { firstPrize: 1, secondPrize: 1, thirdPrize: 1 } 
    }, { new: true });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, message: 'Results deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting result', error: error.message });
  }
};

exports.getEventFullDetails = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let winners = null;
    
    if (event.firstPrize && event.firstPrize.winnerName) {
      winners = {
        firstPrize: event.firstPrize,
        secondPrize: event.secondPrize,
        thirdPrize: event.thirdPrize
      };
    }

    const fullResponse = {
      event: event.toObject(),
      organizer: {
        name: event.organizer || 'College Event Hub'
      },
      winners: winners,
      gallery: [],
      certificates: [], // Not linked for now since using static text inputs
      prizes: event.prizes || []
    };

    res.status(200).json({ success: true, data: fullResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching full details', error: error.message });
  }
};
