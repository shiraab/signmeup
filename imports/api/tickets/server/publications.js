/* eslint-disable prefer-arrow-callback */

import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";

import { Queues } from "/imports/api/queues/queues";
import { Tickets } from "/imports/api/tickets/tickets";

Meteor.publish("tickets.byId", function byId(ticketId) {
  const ticket = Tickets.findOne(ticketId);
  if (!ticket || ticket.status === "deleted") {
    throw new Meteor.Error(
      "tickets.doesNotExist",
      `No ticket exists with id ${ticketId}`
    );
  }

  if (ticket.belongsToUser(this.userId)) {
    return Tickets.find({
      _id: ticketId
    });
  }

  return Tickets.find(
    {
      _id: ticketId
    },
    {
      fields: Tickets.publicFields
    }
  );
});

Meteor.publish("tickets.byQueueId", function byQueueId(queueId) {
  const queue = Queues.findOne(queueId);
  if (!queue) {
    throw new Meteor.Error(
      "queues.doesNotExist",
      `No queue exists with id ${queueId}`
    );
  }

  if (
    Roles.userIsInRole(
      this.userId,
      ["admin", "mta", "hta", "ta"],
      queue.courseId
    )
  ) {
    return Tickets.find({ queueId });
  }

  return Tickets.find(
    {
      queueId,
      status: { $ne: "deleted" }
    },
    {
      fields: Tickets.publicFields
    }
  );
});

Meteor.publish('tickets.inRange', function inRange(courseId, startTime, endTime) {
  if (!Roles.userIsInRole(this.userId, ['admin', 'mta', 'hta', 'ta'], courseId)) {
    throw new Meteor.Error('tickets.inRange.unauthorized',
      'Only TAs and above can get tickets from a specified range.');
  }

  return Tickets.find({
    courseId,
    createdAt: {
      $gte: startTime,
      $lte: endTime,
    },
  });
});
