import mongoose, { Schema, Document } from 'mongoose';

interface IPollOption {
  _id: mongoose.Types.ObjectId;
  text: string;
  voteCount: number;
}

export interface IPoll extends Document {
  question: string;
  options: IPollOption[];
  totalVotes: number;
  createdAt: Date;
}

const pollOptionSchema = new Schema<IPollOption>({
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  voteCount: {
    type: Number,
    default: 0,
    min: 0
  }
});

const pollSchema = new Schema<IPoll>({
  question: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  options: {
    type: [pollOptionSchema],
    required: true,
    validate: {
      validator: function(options: IPollOption[]) {
        return options.length >= 2;
      },
      message: 'Poll must have at least 2 options'
    }
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    transform: (_doc, ret) => {
      const { __v, ...rest } = ret;
      return rest;
    }
  }
});

export default mongoose.model<IPoll>('Poll', pollSchema);
