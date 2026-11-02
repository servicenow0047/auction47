const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id:        { type: String, required: true },       // unique key e.g. "batting_style"
  label:     { type: String, required: true },       // display name e.g. "Batting Style"
  type:      { type: String, required: true,         // input type
               enum: ['text','number','email','tel','select','file','textarea','checkbox'] },
  required:  { type: Boolean, default: false },
  builtIn:   { type: Boolean, default: false },      // can't delete built-in fields
  options:   { type: [String], default: [] },        // for 'select' type
  accept:    { type: String, default: '' },          // for 'file' type: "image/*", ".pdf", etc.
  placeholder: { type: String, default: '' },
  order:     { type: Number, default: 0 },
}, { _id: false });

const registrationSchemaModel = new mongoose.Schema({
  sportName: { type: String, default: 'Cricket' },
  fields:    { type: [fieldSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.models.RegistrationSchema || mongoose.model('RegistrationSchema', registrationSchemaModel);
